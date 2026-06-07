## Context

`MarketStats` already stores TWSE market margin balance value through `twstock.market.marginTrades({ date, exchange: 'TWSE' })`. `Ticker` rows already store same-day closing prices and TWSE per-symbol margin trading data through `twstock.stocks.marginTrades({ date, exchange: 'TWSE' })`.

The market margin maintenance ratio can be computed from those existing cached datasets:

```text
marginMaintenanceRatio =
  sum(symbol.marginTrading.marginBalance * symbol.closePrice * 1000)
  / (marketStats.marginBalance * 1000)
```

`marketStats.marginBalance` is the TWSE market margin balance value in thousand TWD, mapped from `marginBalanceValue`. The result is stored as a decimal ratio, so `1.9898` represents `198.98%`.

## Goals / Non-Goals

**Goals:**

- Calculate and persist TWSE market margin maintenance ratio in `MarketStats`.
- Reuse existing `node-twstock` data and the existing MongoDB cache; do not add a live external API dependency to reads.
- Expose the ratio through `GET /marketdata/market-stats`.
- Add the ratio as a selectable trend chart indicator under "現貨籌碼".
- Keep missing or delayed source data from breaking existing market stats responses.

**Non-Goals:**

- Compute a TPEx or TWSE+TPEx combined maintenance ratio.
- Compute a stocks-only TWSE ratio that excludes ETFs and other credit-trading securities.
- Add the ratio to today stat cards.
- Add the ratio to the barometer AI prompt or invalidate existing `MarketStats.aiAnalysis` cache.
- Rework the existing market stats ingestion architecture.

## Decisions

### D1: Use TWSE all credit-trading symbols for V1

The V1 indicator SHALL use the same TWSE all-symbol credit-trading scope that `node-twstock.stocks.marginTrades({ exchange: 'TWSE' })` currently retrieves. This matches the public "大盤融資維持率" formula and avoids adding a custom scraper for `selectType=STOCK`.

Alternative considered: use TWSE stocks only. That is semantically narrower, but it would diverge from the existing `node-twstock` source method and requires a custom request path. Alternative considered: combine TWSE and TPEx. That may be useful later, but it is a different product metric and should be named separately.

### D2: Store `marginMaintenanceRatio` as a decimal on `MarketStats`

The stored field SHALL be `marginMaintenanceRatio`, rounded to four decimal places as a decimal ratio. This mirrors the existing `txoPutCallRatio` model where frontend code scales decimal values to percent display.

Alternative considered: store percent values directly, such as `198.98`. That is easier to read in MongoDB but inconsistent with existing percent-like fields and increases frontend formatting ambiguity.

### D3: Compute from cached ticker and market stats data after margin ingestion

The calculation should read same-day `Ticker` rows with finite `closePrice` and `marginTrading.marginBalance`, then divide by same-day `MarketStats.marginBalance`. The scheduled calculation should run after the existing market-level and per-symbol margin jobs, for example at minute 45 during the 21:00-22:00 publication window.

Alternative considered: compute inside `updateMarketStats()`. That batch currently runs before ticker ingestion during app bootstrap, so it can miss the per-symbol data dependency. A standalone calculation method and cron job makes the dependency explicit and allows app bootstrap/backfill code to call it after `tickerService.updateTickers()`.

### D4: Keep barometer AI out of V1

The ratio is useful chart context, but adding it to the barometer prompt would change interpretation for existing dates while `MarketStats.aiAnalysis` remains cached. V1 SHALL avoid prompt changes. A later change can add prompt versioning or cache invalidation before incorporating the ratio into AI analysis.

## Risks / Trade-offs

- [Source timing] TWSE margin data is published late and can be delayed by credit institution processing. -> Run the ratio job after existing 21:30/21:35 margin jobs and tolerate missing data without API failure.
- [Missing closing price rows] Some credit-trading rows can lack same-day close data. -> Exclude rows without finite close prices and log enough context for diagnosis.
- [Unit confusion] Market margin balance is stored as thousand TWD while per-symbol balances are lots. -> Centralize the formula in one backend helper/repository method and cover it with unit tests.
- [Historical gaps] Existing dates will not have the new field until recomputed. -> Add a targeted backfill task/script or app-bootstrap call after ticker updates.
- [Metric naming] "大盤融資維持率" can mean different market scopes. -> Label V1 as TWSE all credit-trading symbols in specs and implementation comments/docs where appropriate.

## Migration Plan

1. Add optional `MarketStats.marginMaintenanceRatio`.
2. Add calculation logic and scheduled update.
3. Update app initialization/backfill flow to compute the ratio after ticker ingestion when market stats and ticker rows both exist.
4. Expose the field through existing market stats repository projection.
5. Add frontend model and chart config.
6. Backfill historical dates that already have both market margin balance and ticker margin trading data.

Rollback is straightforward: stop the scheduled calculation and remove the dashboard chip. Existing MongoDB documents with `marginMaintenanceRatio` can remain because the field is optional.
