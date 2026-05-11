## Context

The web app already has a global progress bar for route and HTTP activity, but several feature cards also manage local loading state. Some cards currently render text such as "載入中..." while loading, and some pages initialize data as empty arrays or empty response objects, which makes the UI unable to distinguish "request has not completed" from "request completed with no data".

This change is a frontend-only loading-state refinement across date-driven market pages. It should preserve existing empty and error states while improving perceived stability during initial page load, date changes, and market tab changes.

## Goals / Non-Goals

**Goals:**

- Render skeleton placeholders inside card content while the corresponding data request is in flight.
- Match skeleton layout to the eventual content shape enough to reduce layout shift.
- Make `loading`, `loaded-empty`, and `error` states explicit in pages that currently infer state from empty data.
- Keep skeleton styling consistent with light and dark themes.
- Keep global progress bar behavior unchanged.

**Non-Goals:**

- Change backend APIs or response contracts.
- Replace all loading feedback in the app, such as login prompts or agent streaming UI.
- Add optimistic stale-data rendering for date changes.
- Redesign the affected cards beyond their loading states.

## Decisions

### Use explicit local loading state per data source

Pages that fetch market data SHALL maintain an explicit loading signal/flag for each request whose UI needs a skeleton. This is already present on the home page and dashboard paths, but Hot Stocks and Sector Flow currently need additional state because they initialize to empty data.

Alternative considered: infer loading from `null` data. This is simpler for single-card pages but breaks down for tables that use empty arrays as valid successful results.

### Prefer layout-matched skeleton blocks over generic centered spinners

Skeletons should resemble the final card structure: metric cards render title/value blocks, ranking tables render header and row blocks, chart/map containers render a fixed-height chart block, and snapshot cards render the main rows used by their content.

Alternative considered: keep spinner/text loading states. This is less work, but it does not preserve card geometry and gives weaker feedback about what is loading.

### `ngx-skeleton-loader` is acceptable but not mandatory

Implementation may add `ngx-skeleton-loader` if the work spans multiple pages and repeated skeleton primitives would otherwise be duplicated. The package is compatible with Angular 21 because the current version declares Angular peer dependencies of `>=19.0.0`, and its dependency footprint is small.

Alternative considered: custom SCSS-only shimmer utilities. This avoids a new dependency and is reasonable if the implementation scope stays narrow. If chosen, the custom utility should be centralized rather than duplicated in each component stylesheet.

### Preserve empty and error copy after requests settle

Skeletons are only for in-flight requests. Once a request completes, empty data must still render the existing no-data copy, and errors must still render the existing warning/error copy.

Alternative considered: keep skeleton visible for empty responses. This would obscure important market-calendar and data-availability feedback, especially for non-trading dates or unpublished data.

## Risks / Trade-offs

- Additional dependency risk if `ngx-skeleton-loader` is added -> Keep the dependency optional until implementation; if added, use it through shallow component imports and theme inputs so it can be removed without broad rewrites.
- Layout mismatch between skeleton and real content -> Build skeletons at the same component boundary as the real content and verify desktop/mobile screenshots.
- Confusing loading with empty data -> Add or update unit tests around loading, empty, and error branches for Hot Stocks and Sector Flow.
- Animation accessibility concerns -> Use subtle animation and support reduced-motion behavior through the selected library or shared CSS.

## Migration Plan

1. Add shared skeleton primitives or add `ngx-skeleton-loader` and import it only where needed.
2. Update affected components to pass explicit loading state into card/table components.
3. Replace text-only loading branches with skeleton placeholders.
4. Keep existing empty/error branches and tests, adding coverage where state separation changes.
5. Verify with `npx nx test web` and a web build.

Rollback is straightforward: remove skeleton branches and restore previous text loading states, keeping any explicit loading state that improves correctness.

## Open Questions

- Should the implementation commit to `ngx-skeleton-loader` immediately, or first attempt shared SCSS primitives and only add the package if duplication becomes noticeable?
- Should the Barometer Hero keep its current spinner because AI analysis can feel more process-like, or should it also use a hero-shaped skeleton for consistency?
