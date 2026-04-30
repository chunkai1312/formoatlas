## 1. Stock Summary API

- [x] 1.1 Add stock summary DTOs and response types for `symbol`, `date`, quote, institutional, OHLC, metadata, and context fields.
- [x] 1.2 Implement repository methods to resolve a stock's latest equity row on or before the requested date and return not found for unknown symbols.
- [x] 1.3 Implement stock summary aggregation from `Ticker` and `Equity`, including quote, bounded OHLC rows, institutional fields, industry metadata, market cap, trade value, sector trade-value context, and hot-stock list presence.
- [x] 1.4 Add `GET /marketdata/stock-summary` controller endpoint with validation and Swagger metadata.
- [x] 1.5 Add API tests covering trading-date response, non-trading date fallback, unknown symbol, missing institutional fields, and missing market-cap metadata.

## 2. Stock Detail Page

- [x] 2.1 Add web stock summary model types and `TickerService.getStockSummary`.
- [x] 2.2 Add `/stocks/:symbol` route and standalone stock detail feature component.
- [x] 2.3 Render stock header, actual data date, quote metrics, industry/market labels, and stable loading/error/not-found states.
- [x] 2.4 Render OHLC chart using existing chart conventions and台股紅漲綠跌 semantics.
- [x] 2.5 Render institutional summary and market context sections with stable empty states for null optional data.
- [x] 2.6 Integrate existing watch-list add/remove behavior and login-required prompt on the stock detail page.
- [x] 2.7 Set research assistant context to `stock-detail` with resolved `symbol` and `market` after summary load.
- [x] 2.8 Add stock assistant shortcut prompts that use stock mode and stock context.

## 3. Symbol Entry Points

- [x] 3.1 Make hot-stocks symbol/name cells navigate to `/stocks/:symbol` without breaking existing watch-list toggles.
- [x] 3.2 Make watch-list rows provide a stock detail navigation path while preserving remove controls.
- [x] 3.3 Make market-map stock interactions provide a stock detail navigation path or equivalent navigable affordance.
- [x] 3.4 Add route/navigation tests for stock links and control click isolation.

## 4. Assistant Modes

- [x] 4.1 Add `AssistantMode` / `mode` to web and API market research query models and DTO validation with default `research`.
- [x] 4.2 Update prompt builder to frame `research`, `scan`, and `stock` modes while preserving the existing output schema.
- [x] 4.3 Add read-only `get_stock_summary` agent tool backed by the stock summary repository path.
- [x] 4.4 Update assistant panel composer to expose `research`, `scan`, and `stock` mode controls and submit selected mode.
- [x] 4.5 Wire stock detail shortcuts to open/focus the assistant, select `stock` mode, and populate or submit stock-specific questions.
- [x] 4.6 Add agent tests for default mode, scan prompt framing, stock prompt framing, stock context, and stock summary tool availability.

## 5. Verification

- [x] 5.1 Run targeted API tests for marketdata and agent changes.
- [x] 5.2 Run targeted web tests for stock detail, route behavior, assistant mode UI, and updated symbol rows.
- [x] 5.3 Run lint or typecheck for affected API and web projects.
- [x] 5.4 Manually verify `/stocks/:symbol` with a known TSE symbol, a known OTC symbol, a non-trading selected date, and an unknown symbol.
