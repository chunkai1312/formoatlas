## Why

FormoAtlas already shows price action and institutional flows on stock detail pages, but it does not expose per-stock margin trading data. Adding margin balance and short balance context helps users distinguish price moves driven by financing pressure, short interest, or normal volume rotation.

## What Changes

- Add optional per-stock margin trading data to daily `Ticker` equity documents.
- Collect TWSE and TPEx stock margin trading rows through `node-twstock.stocks.marginTrades()` using the same daily batch pattern as existing ticker updates.
- Expose a concise margin trading summary in `GET /marketdata/stock-summary`.
- Show margin and short balance context on the stock detail page.
- Treat missing margin trading data as an optional data gap, not as an API or page failure.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ticker-schema`: define the optional `marginTrading` sub-document for equity tickers.
- `stock-summary-api`: include per-stock margin trading summary fields when available.
- `stock-detail-page`: present margin trading context on the stock detail page.

## Impact

- Backend schema: `apps/api/src/app/marketdata/schemas/ticker.schema.ts`
- Backend ingestion: `apps/api/src/app/marketdata/services/ticker.service.ts`
- Backend aggregation/types: `TickerRepository.getStockSummary()` and stock summary response types
- Frontend model/service consumers: `apps/web/src/app/core/models/stock-summary.model.ts`
- Frontend UI: `apps/web/src/app/features/stock-detail/stock-detail.component.*`
- Data source: existing `node-twstock` / `nest-twstock`; no new dependency
