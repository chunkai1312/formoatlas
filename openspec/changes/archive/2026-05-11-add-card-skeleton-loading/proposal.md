## Why

Several market overview cards currently render plain loading text or empty states while data requests are still in flight. This causes layout shifts and can briefly imply that a date has no data before the request has completed.

Replacing unloaded card content with layout-matched skeleton placeholders will make page transitions and date changes feel steadier while preserving clear empty and error states after requests finish.

## What Changes

- Add skeleton loading UI for data cards and ranking/table cards that currently show text-only loading states.
- Require feature pages to distinguish `loading`, `loaded-empty`, and `error` states instead of deriving loading from empty arrays or null data alone.
- Keep the global progress bar behavior unchanged; skeletons are local placeholders inside card content.
- Allow use of `ngx-skeleton-loader` when the implementation spans multiple pages and benefits from a shared skeleton component API.

## Capabilities

### New Capabilities
- `card-skeleton-loading`: Defines local skeleton loading behavior for market data cards, dashboard metric cards, ranking tables, and chart/map containers.

### Modified Capabilities

None.

## Impact

- Affected frontend areas:
  - `apps/web/src/app/features/home/`
  - `apps/web/src/app/features/dashboard/`
  - `apps/web/src/app/features/hot-stocks/`
  - `apps/web/src/app/features/sector-flow/`
- May add `ngx-skeleton-loader` as a frontend dependency if selected during implementation.
- No backend API changes.
- No change to global progress bar behavior.
