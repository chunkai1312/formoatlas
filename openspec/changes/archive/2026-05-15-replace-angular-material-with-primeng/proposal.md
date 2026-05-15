## Why

The web app currently depends on Angular Material for its primary UI components and theming, which makes the visual system and component APIs tightly coupled to Material-specific behavior. Moving to PrimeNG gives the app a broader Angular 21-compatible component set while allowing the UI system to standardize around PrimeNG themes, PrimeIcons, and existing FormoAtlas CSS tokens.

## What Changes

- Replace Angular Material UI usage across the web app with PrimeNG components and app-owned layout primitives.
- **BREAKING**: Remove `@angular/material` as an application dependency and remove Material Sass theme configuration from global styles.
- Add PrimeNG, PrimeNG theme configuration, and PrimeIcons for the web frontend.
- Preserve current user-facing workflows, routes, dashboard layout, dark mode behavior, chart rendering, and date-centered navigation behavior.
- Keep `@angular/cdk` only if it remains required by PrimeNG peer dependencies; it SHALL NOT be used as an Angular Material implementation dependency.
- Update specs that currently require Material-specific components or theming terms to describe framework-neutral or PrimeNG-based behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dark-mode`: Replace Angular Material theme requirements with PrimeNG theme and FormoAtlas token requirements.
- `web-dashboard`: Replace Material component-specific requirements such as MatCard, MatChip, MatSpinner, MatTabGroup, and ChipListbox with PrimeNG or framework-neutral UI behavior.
- `topbar-navigation`: Replace Material toolbar, button, menu, datepicker, and icon assumptions with PrimeNG-based equivalents while preserving navigation behavior.

## Impact

- Affected frontend dependencies:
  - Remove `@angular/material`.
  - Add `primeng`, PrimeNG theme package usage, and `primeicons`.
  - Keep or remove `@angular/cdk` based on PrimeNG peer dependency requirements at implementation time.
- Affected frontend areas:
  - `apps/web/src/styles.scss`
  - `apps/web/src/index.html`
  - `apps/web/src/app/layout/toolbar/`
  - `apps/web/src/app/layout/assistant-panel/`
  - `apps/web/src/app/layout/login-required-*`
  - `apps/web/src/app/features/dashboard/`
  - `apps/web/src/app/features/hot-stocks/`
  - `apps/web/src/app/features/sector-flow/`
  - `apps/web/src/app/features/stock-detail/`
  - `apps/web/src/app/features/watchlist/`
  - `apps/web/src/app/features/goal-simulation/`
- No backend API changes.
- No route or persisted user data changes.
