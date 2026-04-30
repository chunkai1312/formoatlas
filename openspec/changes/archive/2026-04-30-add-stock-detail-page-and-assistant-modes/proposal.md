## Why

FormoAtlas already helps users read market-wide clues through the home map, market overview, sector flow, hot stocks, watch list, and research assistant, but it lacks a focused place to drill into a single stock. A stock detail page can connect those market-wide signals into one date-centered research context, while assistant modes can make the existing research assistant feel purposeful without splitting the agent runtime.

## What Changes

- Add a stock detail route that presents a single symbol as a盤後研究脈絡頁 rather than an intraday quote page or fundamental encyclopedia.
- Add a stock summary aggregate API that returns one consistent date snapshot for header, quote, OHLC, institutional flow, equity metadata, and market context.
- Add assistant modes (`research`, `scan`, `stock`) as intent-level controls that adjust prompt framing but keep the existing structured response schema.
- Integrate stock pages with the assistant by setting stock-aware context and offering stock analysis quick prompts.
- Add navigation entry points from symbol-bearing surfaces such as hot stocks, market map, and watch list rows.
- Defer realtime quotes, news, financial statements, target prices, trading recommendations, and multi-agent runtimes.

## Capabilities

### New Capabilities

- `stock-summary-api`: Defines the aggregate stock summary endpoint and response contract for one consistent stock/date snapshot.
- `stock-detail-page`: Defines the stock detail route, stock research layout, symbol entry points, watch list integration, and stock assistant shortcuts.

### Modified Capabilities

- `market-research-agent`: Adds assistant intent modes and stock-aware page context while preserving the current validated answer schema and read-only execution model.

## Impact

- Backend: `MarketDataController`, `TickerRepository`, DTOs, stock summary response types, and market research agent prompt/query DTO/tooling.
- Frontend: Angular routes, ticker service/models, stock detail feature components, symbol links in existing market pages, assistant panel mode controls, and research assistant context handling.
- Tests: API repository/controller tests for stock summary behavior, agent prompt/query tests for modes, route tests, component tests for stock page states and quick prompts.
- Data: Reuses existing `Ticker` and `Equity` collections; no new persistence schema is required for V1.
