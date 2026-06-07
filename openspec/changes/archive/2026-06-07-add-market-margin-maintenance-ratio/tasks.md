## 1. Backend Schema And Types

- [x] 1.1 Add optional `marginMaintenanceRatio` to `MarketStats` schema with decimal-ratio semantics.
- [x] 1.2 Add `marginMaintenanceRatio` to backend market stats return typing if explicit response types are introduced or touched.
- [x] 1.3 Add `marginMaintenanceRatio?: number` to the frontend `MarketStats` model.

## 2. Backend Calculation

- [x] 2.1 Add a repository/helper method to compute TWSE financed market value from same-day ticker `closePrice` and `marginTrading.marginBalance`.
- [x] 2.2 Add `MarketStatsService.updateMarginMaintenanceRatio(date)` to read same-day `MarketStats.marginBalance`, compute the ratio, round to four decimal places, and update `MarketStats`.
- [x] 2.3 Ensure calculation excludes rows without finite close prices or positive margin balances without failing the entire date.
- [x] 2.4 Add warn logging for missing denominator data or no eligible ticker rows.

## 3. Scheduling And Backfill

- [x] 3.1 Add a nightly cron schedule for `updateMarginMaintenanceRatio` after the existing market and ticker margin-trading jobs.
- [x] 3.2 Update app initialization/backfill flow so `marginMaintenanceRatio` is computed after `tickerService.updateTickers()` for each date.
- [x] 3.3 Add a targeted backfill script or documented command path for recomputing historical dates that already have both market stats and ticker margin data.

## 4. Frontend Trend Chart

- [x] 4.1 Add "融資維持率" to the "現貨籌碼" indicator list in `chart-config.ts`.
- [x] 4.2 Configure the indicator as a percent-scaled line chart using `marginMaintenanceRatio`.
- [x] 4.3 Ensure null or missing ratio values render as chart gaps without breaking the trend chart.

## 5. Tests

- [x] 5.1 Add backend tests covering the ratio formula, rounding, missing denominator, and missing ticker close-price behavior.
- [x] 5.2 Add backend tests covering `updateMarginMaintenanceRatio` repository/service interactions.
- [x] 5.3 Add frontend tests or focused config assertions covering the new "融資維持率" chip and percent scaling.

## 6. Verification

- [x] 6.1 Run targeted API tests for market stats ratio calculation.
- [x] 6.2 Run targeted web tests for dashboard trend chart config/rendering.
- [x] 6.3 Run `openspec validate add-market-margin-maintenance-ratio --strict`.
