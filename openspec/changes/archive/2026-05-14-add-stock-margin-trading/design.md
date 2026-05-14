## Context

`Ticker` currently stores daily market rows keyed by `{ date, symbol }`. Equity ticker rows are enriched over multiple scheduled ingestion steps: quote data, institutional investor trades, and equity profile metadata. `MarketStats` already stores market-level margin and short balance, but stock detail pages do not expose per-stock margin trading data.

`node-twstock` provides `stocks.marginTrades({ date, exchange })`, which returns all stock margin trading rows for TWSE or TPEx on a date. The returned fields include financing buy/sell/redeem, margin balance, short buy/sell/redeem, short balance, quota, offset, and note.

## Goals / Non-Goals

**Goals:**

- Store per-stock margin trading data for TWSE and TPEx equity tickers.
- Keep the ingestion model aligned with existing `TickerService` daily batch updates.
- Expose a concise margin trading summary from `stock-summary`.
- Render margin trading context on the stock detail page without failing when data is absent.

**Non-Goals:**

- Add margin trading rankings to `hot-stocks`.
- Add agent prompt/tool changes for margin trading context.
- Backfill historical margin trading data automatically.
- Add a new dependency or replace `node-twstock`.

## Decisions

### D1: Store margin trading as an optional `Ticker.marginTrading` sub-document

`marginTrading` belongs on the daily equity ticker document because its natural key is the same as quote and institutional data: `{ date, symbol }`. This matches the existing enrichment pattern where `TickerService` writes multiple partial updates into the same document.

Alternative considered: create a separate `StockMarginTrading` collection. That would isolate schema concerns, but it adds another lookup to `stock-summary` and creates a second daily equity time series that must be kept in date/symbol sync with `Ticker`. For V1, the extra collection does not buy enough separation to justify the added query and migration surface.

### D2: Use `stocks.marginTrades({ date, exchange })` in market-wide batches

The ingestion should call `node-twstock.stocks.marginTrades()` once per exchange without `symbol`, then map each returned row into a partial ticker update. This avoids one HTTP request per stock and mirrors the existing quote and institutional ingestion style.

Alternative considered: fetch margin data on demand for a requested stock. That would make the API depend on live external calls, break the current cached market data model, and make stock detail latency less predictable.

### D3: Keep fields close to the data source and add derived change fields

The stored sub-document should preserve the source fields: `marginBuy`, `marginSell`, `marginRedeem`, `marginBalancePrev`, `marginBalance`, `marginQuota`, `shortBuy`, `shortSell`, `shortRedeem`, `shortBalancePrev`, `shortBalance`, `shortQuota`, `offset`, and `note`. It should also store `marginBalanceChange` and `shortBalanceChange` derived from current minus previous balance for straightforward UI and agent consumption later.

All stock-level margin trading quantities SHALL use the unit returned by `stocks.marginTrades()`: shares in trading lots, not market-level value fields.

### D4: Expose a concise `stock-summary.marginTrading` object

`stock-summary` should include enough fields for the stock detail page: balances, changes, buy/sell activity, offset, and note. When the ticker row has no margin data, the field should be `null`.

This keeps stock detail as the only V1 consumer. Ranking endpoints and assistant prompts can be expanded in a later change once UI usage proves useful.

## Risks / Trade-offs

- [Source timing] Margin trading data may be published after quote or institutional data. -> Schedule ingestion later than quote ingestion and make the field optional so pages still load before the data arrives.
- [Partial data] Some symbols may not have margin trading rows or may include status notes. -> Store `note` and expose null-safe summaries.
- [TPEx non-equity rows] TPEx data can include warrant-like symbols. -> Apply the same `isOtcWarrant()` filter used by TPEx equity quote and institutional ingestion.
- [Historical gaps] Existing ticker rows will not have `marginTrading`. -> Treat the field as optional and avoid migration requirements for V1.

## Migration Plan

1. Add the optional schema field and response model fields.
2. Deploy ingestion and API changes.
3. New daily scheduled updates populate future ticker rows.
4. Existing historical rows remain valid with `marginTrading: null` in stock summary.

Rollback is straightforward: stop invoking the new ingestion methods and ignore the optional `marginTrading` field. Existing documents with the sub-document can remain in MongoDB because no existing query depends on its absence.
