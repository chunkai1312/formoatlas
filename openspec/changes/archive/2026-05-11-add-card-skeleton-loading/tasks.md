## 1. Skeleton Foundation

- [x] 1.1 Decide whether to add `ngx-skeleton-loader` or implement shared SCSS skeleton primitives based on duplication across affected components.
- [x] 1.2 Add the selected skeleton primitive and theme styling for light mode, dark mode, and reduced-motion contexts.
- [x] 1.3 Add reusable skeleton variants for metric cards, compact snapshot rows, table rows, and chart/map containers.

## 2. Explicit Loading State

- [x] 2.1 Add explicit loading state to Hot Stocks data fetching so loading, empty rankings, and request failures are distinguishable.
- [x] 2.2 Add explicit loading state to Sector Flow data fetching so loading, empty rows, and request failures are distinguishable.
- [x] 2.3 Ensure market tab changes and global date changes reset local loading state without showing stale empty states.

## 3. Card And Table Integration

- [x] 3.1 Replace home snapshot card text loading states with layout-matched skeleton content.
- [x] 3.2 Replace dashboard stats overview loading copy with metric-card skeletons.
- [x] 3.3 Add loading inputs and skeleton rows to Hot Stocks ranking tables.
- [x] 3.4 Add loading inputs and skeleton rows to Sector Flow distribution and ranking cards.
- [x] 3.5 Replace chart/map loading copy with fixed-size visualization skeleton containers where applicable.
- [x] 3.6 Decide whether to convert the Barometer Hero spinner to a hero-shaped skeleton and implement the chosen behavior.

## 4. Tests And Verification

- [x] 4.1 Add or update unit tests for Hot Stocks loading versus empty versus error rendering.
- [x] 4.2 Add or update unit tests for Sector Flow loading versus empty behavior and selected-sector reset behavior.
- [x] 4.3 Add or update component tests for dashboard/home skeleton branches where practical.
- [x] 4.4 Run `npx nx test web`.
- [x] 4.5 Run `npx nx build web`.
- [x] 4.6 Visually verify the affected pages on desktop and mobile widths, including dark mode and reduced-motion behavior.
