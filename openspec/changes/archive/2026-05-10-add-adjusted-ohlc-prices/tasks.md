## 1. Price Adjustment Event Data Layer

- [x] 1.1 Create `PriceAdjustmentEvent` schema with normalized fields, raw source payload, indexes, and unique upsert key
- [x] 1.2 Create `PriceAdjustmentEventRepository` with upsert and symbol/date-range lookup methods
- [x] 1.3 Register the schema and repository in `MarketDataModule`
- [x] 1.4 Add backend unit tests for repository upsert behavior and same-day multiple event preservation

## 2. Event Synchronization and Normalization

- [x] 2.1 Implement normalization for `stocks.dividends()` rows, including dividend factor calculation
- [x] 2.2 Implement normalization for `stocks.capitalReductions()` rows using `resumeDate` and `referencePrice / previousClose`
- [x] 2.3 Implement normalization for `stocks.splits()` rows using `resumeDate` and `referencePrice / previousClose`
- [x] 2.4 Implement normalization for `stocks.etfSplits()` rows for both split and reverse split event types
- [x] 2.5 Implement `PriceAdjustmentEventService` update methods for TWSE and TPEx event sources
- [x] 2.6 Add daily scheduled sync methods and allow manual date-based updates
- [x] 2.7 Add backend unit tests for invalid source rows, factor calculation, event type mapping, and ETF reverse split handling

## 3. Adjusted OHLC Calculation

- [x] 3.1 Implement adjusted price calculation service that loads events and applies factor products to OHLC price fields
- [x] 3.2 Ensure event factors apply only to candles where `candle.date < event.effectiveDate`
- [x] 3.3 Ensure same-day multiple event factors are multiplied together
- [x] 3.4 Preserve raw `tradeVolume`, `tradeValue`, and `tradeWeight` in adjusted OHLC responses
- [x] 3.5 Ensure index symbols and symbols without events return raw OHLC when adjusted calculation is requested
- [x] 3.6 Add backend unit tests for backward adjustment, event-date exclusion, same-day factor multiplication, and index fallback

## 4. OHLC API Integration

- [x] 4.1 Extend `GetTickerOhlcDto` with optional `adjusted` boolean query parsing
- [x] 4.2 Update market data controller/repository/service flow so `GET /marketdata/tickers?adjusted=true` returns adjusted OHLC
- [x] 4.3 Preserve existing default behavior when `adjusted` is omitted or false
- [x] 4.4 Add API/controller tests for raw query, adjusted query, missing symbol validation, and index adjusted fallback

## 5. Backtesting Integration

- [x] 5.1 Update `BacktestingService` to request adjusted OHLC for all backtests
- [x] 5.2 Add warning text that backtest results use adjusted stock prices
- [x] 5.3 Update backend backtesting tests to verify adjusted OHLC is requested and warning text is returned

## 6. Stock Detail UI

- [x] 6.1 Extend Angular ticker service to accept an adjusted boolean and send `adjusted=true` only when enabled
- [x] 6.2 Add stock detail K-line price basis state and controls for raw vs adjusted price
- [x] 6.3 Refetch and render stock OHLC when the user switches price basis while preserving date range and chart behavior
- [x] 6.4 Add frontend unit tests for default basis, adjusted request, raw request, and chart state preservation

## 7. Validation

- [x] 7.1 Run `npx nx test api`
- [x] 7.2 Run `npx nx test web`
- [x] 7.3 Run `openspec status --change add-adjusted-ohlc-prices`
