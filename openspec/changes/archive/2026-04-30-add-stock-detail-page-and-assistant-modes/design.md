## Context

FormoAtlas currently presents date-centered market context through market overview, sector flow, hot stocks, market map, watch list, and a persisted market research assistant. Symbol-level data exists in `Ticker` and `Equity`, and the web app already has an OHLC endpoint, ticker metadata lookup, hot-stock rankings, market map data, and assistant context fields for `symbol` and `sector`.

The missing product layer is a single-stock research surface that ties those market-wide clues back to one ticker. The implementation should stay aligned with FormoAtlas'盤後研究 focus: no realtime quote feed, no news ingestion, no financial statement source, and no personalized trade recommendation flow.

## Goals / Non-Goals

**Goals:**

- Provide a `/stocks/:symbol` page that reads as a stock research context page.
- Provide one stock summary aggregate endpoint so the page receives a consistent stock/date snapshot.
- Reuse existing `Ticker` and `Equity` data instead of adding a new persistence model.
- Add assistant intent modes (`research`, `scan`, `stock`) without changing the response schema or splitting the agent runtime.
- Make symbol-bearing surfaces link naturally into the stock page while preserving global date context.

**Non-Goals:**

- Realtime quotes, intraday charts, order placement, alerts, target prices, or buy/sell recommendations.
- News, financial statements, valuation ratios, or external fundamental data.
- Multiple Copilot sessions or separate agents per mode.
- Persisting assistant mode as long-term user preference in V1.

## Decisions

### Use a stock summary aggregate endpoint

Add a read-only endpoint such as `GET /marketdata/stock-summary?symbol=2330&date=YYYY-MM-DD`. The response should include the latest available equity snapshot on or before the requested date, recent OHLC data, equity metadata, institutional flow fields, and lightweight market context.

Alternative considered: have the Angular page compose metadata, OHLC, hot stocks, and market map calls. That would keep the API smaller, but it makes date fallback and partial-data behavior inconsistent across page panels. The existing hot-stocks and market-map endpoints already favor aggregate responses for page-level views, so stock summary should follow the same pattern.

### Keep V1 market context lightweight

V1 context should identify whether the stock appears in hot-stock top-20 lists, provide industry metadata where available, and expose market-cap/trade-value sizing when calculable from `Equity.issuedShares`. Full percentile ranking across all equities and same-industry rank history should be deferred.

Alternative considered: compute full market and sector ranks in V1. That is useful, but it adds heavier aggregation work and more edge cases before the core page is validated.

### Keep assistant modes as intent-level prompt framing

Extend the assistant request with an optional `mode: research | scan | stock`. The same Copilot SDK session creation, tool policy, output schema, and conversation persistence remain in place. The prompt builder should describe the requested analysis frame, not change the schema.

Alternative considered: separate schemas or separate agents per mode. That would make mode-specific UI richer, but it increases validation, presentation, and testing cost before we know which modes users actually use.

### Add a stock summary tool for the assistant

Expose a read-only `get_stock_summary` market tool that uses the same repository path as the stock summary API. In stock mode, this tool should be the primary way for the agent to ground claims about a ticker.

Alternative considered: ask the agent to combine OHLC, hot stocks, and sector flow tools. That duplicates composition logic and makes agent output less deterministic.

### Treat missing dates and missing symbols explicitly

If the requested date has no data but a prior trading date does, the API returns `date` and `requestedDate` separately. If the symbol cannot be resolved to an equity ticker, the API returns not found. The frontend should show an explicit unavailable state for missing symbols and a date mismatch notice for fallback data.

## Risks / Trade-offs

- [Risk] Aggregate endpoint grows into a broad stock encyclopedia. -> Mitigation: keep V1 response scoped to existing quote, OHLC, institutional, metadata, and lightweight market context fields.
- [Risk] Assistant mode labels imply capabilities not supported by data. -> Mitigation: use mode labels and quick prompts that reflect盤後觀察, scanning, and stock context, and retain warnings for unsupported claims.
- [Risk] Market-map or hot-stocks context may be missing for a symbol. -> Mitigation: return null/empty context fields without failing the stock summary.
- [Risk] Stock links from existing dense tables may disrupt scanning. -> Mitigation: make symbol/name cells navigable while preserving existing row controls such as watch-list toggles.
- [Risk] Date fallback may confuse users. -> Mitigation: include both requested and actual data date in API and render the actual data date in the page header.

## Migration Plan

No database migration is required. Deploy backend additions first or together with the frontend. If the stock summary endpoint is unavailable, the stock page should show an error state and existing pages continue to function. Rolling back the web route and symbol links removes user access to the feature without changing stored data.

## Open Questions

- Should `/stocks/:symbol` infer market when the same symbol could theoretically exist across exchanges, or should the route later support a `market` query parameter?
- Should V2 add full market/sector percentile ranks once the page shape is validated?
- Should assistant mode be persisted per conversation after V1, or remain a per-message intent?
