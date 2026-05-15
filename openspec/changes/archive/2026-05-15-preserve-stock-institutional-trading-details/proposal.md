## Why

FormoAtlas currently stores stock-level institutional investor data only after aggregating raw rows into foreign, investment trust, and dealer totals. This loses source-level detail such as foreign dealer, dealer proprietary, dealer hedge, and all-institution rows, making later stock research and UI drill-down impossible without refetching historical data.

## What Changes

- Preserve the full per-stock institutional investor rows returned by `node-twstock.stocks.institutional()` for TWSE and TPEx equity ticker rows.
- Move stock-level institutional aggregate fields into `Ticker.institutionalTrading.summary` for rankings, consecutive-day logic, and stock summary consumers.
- Add source-preserving rows under `Ticker.institutionalTrading.details` on each daily equity ticker.
- Remove the legacy top-level `Ticker.instInvestors` field. Existing ticker rows will be re-fetched, so no storage migration is required.
- Extend stock summary institutional data with optional row-level details while preserving existing top-level institutional summary fields.
- Add stock detail institutional drill-down UI for the preserved raw rows.
- Keep historical rows without preserved details valid; no automatic historical backfill is required for this change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ticker-schema`: Ticker documents SHALL preserve raw stock institutional investor rows in addition to existing aggregate institutional fields.
- `stock-summary-api`: Stock summary SHALL expose preserved institutional investor detail rows when available.
- `stock-detail-page`: Stock detail page SHALL present institutional investor row-level details when stock summary provides them.

## Impact

- Backend schema: `apps/api/src/app/marketdata/schemas/ticker.schema.ts`
- Backend ingestion: `apps/api/src/app/marketdata/services/ticker.service.ts`
- Backend summary projection and types: `apps/api/src/app/marketdata/repositories/ticker.repository.ts`, `apps/api/src/app/marketdata/types/stock-summary.types.ts`
- Frontend summary model and stock detail page rendering: `apps/web/src/app/core/models/stock-summary.model.ts`, `apps/web/src/app/features/stock-detail/*`
- Tests: marketdata ingestion/repository tests and stock detail component tests
