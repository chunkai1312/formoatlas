## Why

FormoAtlas already tracks market-level margin balance, but users cannot see whether outstanding financing is becoming safer or more vulnerable as market prices move. Adding a market margin maintenance ratio gives the dashboard a clearer view of retail financing risk beyond balance changes alone.

## What Changes

- Add a TWSE market margin maintenance ratio to daily `MarketStats`.
- Calculate the ratio from TWSE all credit-trading symbols using margin balance lots, same-day closing prices, and the TWSE market margin balance value.
- Expose the ratio through `GET /marketdata/market-stats`.
- Add "融資維持率" to the dashboard "現貨籌碼" trend chart group.
- Keep the V1 scope out of the barometer AI prompt and today stat cards to avoid cached-analysis churn and dashboard crowding.

## Capabilities

### New Capabilities
- `market-margin-maintenance-ratio`: define TWSE market margin maintenance ratio calculation, persistence, API exposure, scheduling, and missing-data behavior.

### Modified Capabilities
- `web-dashboard`: add "融資維持率" as a selectable spot-market chip indicator in the market overview trend chart.

## Impact

- Backend schema: `apps/api/src/app/marketdata/schemas/market-stats.schema.ts`
- Backend calculation and scheduling: `apps/api/src/app/marketdata/services/market-stats.service.ts`, `apps/api/src/app/marketdata/services/ticker.service.ts`, and/or `apps/api/src/app/marketdata/repositories/ticker.repository.ts`
- Backend API output: `GET /marketdata/market-stats`
- Frontend models and chart config: `apps/web/src/app/core/models/market-stats.model.ts`, `apps/web/src/app/features/dashboard/components/trend-chart/chart-config.ts`
- OpenSpec specs: `market-margin-maintenance-ratio`, `web-dashboard`
