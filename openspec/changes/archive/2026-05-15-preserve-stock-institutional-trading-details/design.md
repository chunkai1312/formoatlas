## Context

Stock institutional ingestion currently calls `node-twstock.stocks.institutional({ date, exchange })` for TWSE and TPEx, then immediately aggregates each stock's raw `institutional[]` rows into three summary buckets:

- `fini`: foreign investors plus foreign dealers
- `sitc`: investment trusts
- `dealers`: dealer proprietary plus dealer hedge

Those aggregates are currently stored in `Ticker.instInvestors` and are already used by hot-stock rankings, stock summary, stock detail, and consecutive buy/sell day calculations. The raw source rows include more detail than the aggregate buckets, including rows such as `外資及陸資(不含外資自營商)`, `外資自營商`, `自營商(自行買賣)`, `自營商(避險)`, `自營商`, and `三大法人`. Once aggregated, those rows cannot be reconstructed.

`Ticker.marginTrading` provides the closest existing pattern: preserve source-level daily stock data in an optional sub-document on the `{ date, symbol }` ticker row, while stock summary exposes a concise view and old rows remain valid when the optional field is absent.

## Goals / Non-Goals

**Goals:**

- Preserve all institutional investor rows returned by `stocks.institutional()` for each TWSE and TPEx equity ticker.
- Keep existing aggregate institutional behavior intact for rankings, consecutive-day calculations, and existing API consumers.
- Move persisted stock institutional aggregates from top-level `instInvestors` into `institutionalTrading.summary`.
- Use one shared mapper so preserved details and aggregate fields cannot drift.
- Expose preserved row-level institutional details through stock summary when available.
- Render stock detail institutional drill-down without failing on old rows that lack preserved details.

**Non-Goals:**

- Automatically migrate historical ticker rows. The institutional data will be re-fetched instead.
- Add new institutional ranking endpoints.
- Change market-level `MarketStats` institutional fields.
- Add a new database collection for institutional rows.

## Decisions

### D1: Store summary and details on `Ticker.institutionalTrading`

Add an optional `institutionalTrading` sub-document to daily equity ticker rows:

```ts
institutionalTrading: {
  summary: {
    fini: { buy: number; sell: number; net: number; consecutiveDays?: number };
    sitc: { buy: number; sell: number; net: number; consecutiveDays?: number };
    dealers: { buy: number; sell: number; net: number };
  };
  details: [
    {
      investor: string;
      buy: number | null;
      sell: number | null;
      net: number;
    }
  ];
}
```

Rationale: the natural key for stock institutional data is the same daily ticker row key used by quote and margin data: `{ date, symbol }`. Keeping both aggregate summary and source details under one `institutionalTrading` field avoids a second time-series collection and avoids a split between `instInvestors` and detail rows.

Alternative considered: create a separate `StockInstitutionalTrading` collection. This would make raw row storage explicit, but it introduces another lookup path, another deletion/backfill surface, and a second source of truth for the same stock/date.

### D2: Preserve source rows as an array, not only normalized fixed fields

The preserved `rows[]` should keep the source investor labels and values. Some source rows have only `difference`/net and no buy/sell values, so `buy` and `sell` must allow `null`.

Rationale: `node-twstock` returns slightly different row sets for TWSE and TPEx, and historical formats can vary. An array preserves source fidelity without making schema changes for every source label variation.

Alternative considered: store fixed fields such as `foreignExDealer`, `dealerProprietary`, and `dealerHedge`. That is convenient for UI, but it is less resilient to exchange or source format differences and does not preserve unknown future rows.

### D3: Derive `institutionalTrading.summary` from the same mapped rows

The ingestion mapper should produce both:

- `institutionalTrading.details`
- `institutionalTrading.summary.fini`, `institutionalTrading.summary.sitc`, and `institutionalTrading.summary.dealers`

The top-level `Ticker.instInvestors` field should be removed. Hot-stock ranking paths, stock summary projection, and consecutive-day lookups should read from `institutionalTrading.summary`.

### D4: Expose details inside `stock-summary.institutional`

Keep current stock summary fields:

- `finiNet`
- `sitcNet`
- `dealersNet`
- `finiConsecutiveDays`
- `sitcConsecutiveDays`

Add optional detail rows under the same institutional object:

```ts
institutional: {
  finiNet: number | null;
  sitcNet: number | null;
  dealersNet: number | null;
  finiConsecutiveDays: number | null;
  sitcConsecutiveDays: number | null;
  details: InstitutionalTradingRow[];
}
```

Rationale: stock summary already groups stock-level institutional context under `institutional`. Adding details there keeps the response cohesive and avoids introducing a parallel top-level concept for one consumer.

### D5: Old rows remain valid without migration

Existing historical ticker rows may contain top-level `instInvestors`, but this change does not migrate them. After deployment, institutional data will be re-fetched so new ticker rows contain `institutionalTrading.summary` and `institutionalTrading.details`.

Rationale: the user intends to re-fetch institutional data, so supporting both persisted shapes would keep legacy complexity in the code path unnecessarily.

## Risks / Trade-offs

- [Source row variation] TWSE and TPEx can return different row labels or row counts. -> Preserve the row array by label and compute known aggregate fields by label groups while retaining unknown rows.
- [Partial buy/sell values] Rows like `自營商` or `三大法人` may only have net values. -> Allow `buy` and `sell` to be `null` in preserved rows and UI.
- [Response size] Stock summary grows slightly. -> Detail rows are bounded by the source row count for a single stock/date, so the size increase is small.
- [Historical gaps] Existing rows cannot show row-level detail until re-fetched. -> Treat `institutionalTrading` as optional and expose nullable summary values plus an empty details array when absent.
- [Breaking storage path] Existing code paths used `instInvestors.*`. -> Update all repository queries and projections to use `institutionalTrading.summary.*`.

## Migration Plan

1. Add optional schema/types for `Ticker.institutionalTrading.summary` and `Ticker.institutionalTrading.details`.
2. Deploy ingestion changes. New daily institutional updates populate `institutionalTrading` only.
3. Update stock summary and stock detail to consume details when present and show neutral empty detail state when absent.
4. Re-fetch institutional data for desired dates; no migration script is required.

Rollback: restore the prior `instInvestors` write/read paths and re-fetch affected institutional rows if needed.

## Open Questions

- Should a future separate backfill command be added for selected historical date ranges?
- Should the assistant tool later include institutional detail rows in stock-mode answers, or keep using summary fields until a dedicated prompt change?
