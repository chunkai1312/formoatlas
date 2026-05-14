## 1. Backend Schema And Types

- [x] 1.1 Add `MarginTrading` sub-schema to `apps/api/src/app/marketdata/schemas/ticker.schema.ts` with the fields defined in `ticker-schema`.
- [x] 1.2 Add backend stock summary margin trading interfaces in `apps/api/src/app/marketdata/types/stock-summary.types.ts`.
- [x] 1.3 Add frontend stock summary margin trading interfaces in `apps/web/src/app/core/models/stock-summary.model.ts`.

## 2. Backend Ingestion

- [x] 2.1 Add TWSE margin trading ingestion to `TickerService` using `twstock.stocks.marginTrades({ date, exchange: 'TWSE' })`.
- [x] 2.2 Add TPEx margin trading ingestion to `TickerService` using `twstock.stocks.marginTrades({ date, exchange: 'TPEx' })` and existing OTC warrant filtering.
- [x] 2.3 Map each margin trading row into `Ticker.marginTrading`, including `marginBalanceChange` and `shortBalanceChange`.
- [x] 2.4 Add the new TWSE/TPEx margin trading methods to `updateTickers()` batch order and configure suitable cron schedules.

## 3. Stock Summary API

- [x] 3.1 Update `TickerRepository.getStockSummary()` to project `marginTrading` from the resolved ticker row.
- [x] 3.2 Ensure stock summary returns `marginTrading: null` when no margin trading data exists.
- [x] 3.3 Add or update API tests covering stock summary with margin trading data and missing margin trading data.

## 4. Stock Detail UI

- [x] 4.1 Add stock detail computed values or helpers for formatting margin and short balance metrics.
- [x] 4.2 Render a margin trading section on the stock detail page with balances, changes, activity fields, offset, and note.
- [x] 4.3 Render a neutral empty state when `stock.marginTrading` is `null`.
- [x] 4.4 Add or update component tests covering available and missing margin trading data.

## 5. Verification

- [x] 5.1 Run targeted API tests for marketdata stock summary and ticker ingestion changes.
- [x] 5.2 Run targeted web tests for stock detail rendering.
- [x] 5.3 Run `openspec validate add-stock-margin-trading --strict`.
