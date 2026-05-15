## 1. Backend Schema And Types

- [x] 1.1 Add `InstitutionalTrading` schema with `summary` and `details`, and remove top-level `Ticker.instInvestors` from `apps/api/src/app/marketdata/schemas/ticker.schema.ts`.
- [x] 1.2 Add backend stock summary institutional detail interfaces to `apps/api/src/app/marketdata/types/stock-summary.types.ts`.
- [x] 1.3 Add frontend stock summary institutional detail interfaces to `apps/web/src/app/core/models/stock-summary.model.ts`.

## 2. Backend Ingestion

- [x] 2.1 Add a shared institutional trading mapper that preserves raw `institutional[]` rows with `investor`, `buy`, `sell`, and `net`.
- [x] 2.2 Have the mapper compute `institutionalTrading.summary.fini`, `institutionalTrading.summary.sitc`, and `institutionalTrading.summary.dealers` from the preserved rows.
- [x] 2.3 Update TWSE stock institutional ingestion to write `institutionalTrading.summary` and `institutionalTrading.details` without writing `instInvestors`.
- [x] 2.4 Update TPEx stock institutional ingestion to write preserved details while keeping existing OTC warrant filtering.
- [x] 2.5 Keep `fini` and `sitc` consecutive-day calculations based on the derived aggregate totals.
- [x] 2.6 Add or update API service tests covering TWSE detail preservation, TPEx warrant filtering, net-only rows, and aggregate compatibility.

## 3. Stock Summary API

- [x] 3.1 Update `TickerRepository.getStockSummary()` to project summary fields from `Ticker.institutionalTrading.summary` and details from `Ticker.institutionalTrading.details`.
- [x] 3.2 Ensure stock summary returns `institutional.details: []` when no preserved details exist.
- [x] 3.3 Preserve existing nullable institutional summary behavior when no institutional data exists.
- [x] 3.4 Add or update repository tests covering stock summary with preserved summary/details and missing institutional data.

## 4. Stock Detail UI

- [x] 4.1 Update stock detail institutional helpers/computed values to format detail row buy, sell, and net values.
- [x] 4.2 Render institutional detail rows in the stock detail institutional section.
- [x] 4.3 Render neutral placeholders for null buy or sell values.
- [x] 4.4 Render a neutral empty state when institutional details are empty while preserving existing summary metrics.
- [x] 4.5 Add or update component tests covering available details, net-only rows, and legacy empty details.

## 5. Verification

- [x] 5.1 Run targeted API tests for ticker institutional ingestion and stock summary projection.
- [x] 5.2 Run targeted web tests for stock detail institutional rendering.
- [x] 5.3 Run `npx nx test api`.
- [x] 5.4 Run relevant web tests or `npx nx test web` if stock detail changes are broad.
- [x] 5.5 Run `openspec validate preserve-stock-institutional-trading-details --strict`.
