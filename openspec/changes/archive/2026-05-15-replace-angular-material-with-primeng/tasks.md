## 1. PrimeNG Setup

- [x] 1.1 Add PrimeNG and PrimeIcons dependencies, and add the PrimeNG theme package/configuration required by the selected PrimeNG 21 setup.
- [x] 1.2 Configure PrimeNG providers in `apps/web/src/app/app.config.ts` for standalone Angular bootstrapping.
- [x] 1.3 Decide and document the default PrimeNG preset/theme mapping for light and dark mode.
- [x] 1.4 Keep `@angular/cdk` only if required by PrimeNG peer dependencies; do not use it as an Angular Material implementation dependency.

## 2. Global Theme Migration

- [x] 2.1 Remove `@use '@angular/material'`, `mat.core()`, `mat.define-theme`, and `mat.all-component-themes` usage from `apps/web/src/styles.scss`.
- [x] 2.2 Rebuild global light/dark styling around PrimeNG theme configuration and existing FormoAtlas CSS custom properties.
- [x] 2.3 Ensure `html.dark-mode` continues to drive page background, surfaces, text colors, toolbar colors, market colors, and PrimeNG component/overlay dark styling.
- [x] 2.4 Remove the Google Material Icons font link from `apps/web/src/index.html` after icon migration is complete.

## 3. Toolbar And Navigation Migration

- [x] 3.1 Replace `MatToolbar`, Material buttons, Material icon buttons, and Material icons in `layout/toolbar` with PrimeNG or app-owned controls.
- [x] 3.2 Replace `MatDatepicker` and `MatNativeDateModule` usage with PrimeNG DatePicker while preserving global date updates and future-date disabling.
- [x] 3.3 Replace `MatMenu` usage with PrimeNG menu/popover behavior while preserving the signed-in user menu and logout action.
- [x] 3.4 Preserve TopBar brand link, route active states, watchlist login gating, theme toggle behavior, and accessibility labels.
- [x] 3.5 Update toolbar-related tests for changed markup and PrimeNG interaction behavior.

## 4. Dashboard Migration

- [x] 4.1 Replace Material cards in dashboard hero, stat cards, K-line chart, and trend chart containers with PrimeNG cards or app-owned surfaces.
- [x] 4.2 Replace Material chips in the Barometer Hero with PrimeNG or app-owned label/chip styling while preserving level color opacity.
- [x] 4.3 Replace Material spinner/loading UI in the Barometer Hero with PrimeNG or app-owned loading UI.
- [x] 4.4 Replace `MatTabGroup` and `MatChipListbox` trend controls with PrimeNG tabs and selection controls or app-owned segmented controls.
- [x] 4.5 Preserve dashboard chart behavior, range selectors, empty states, tooltip behavior, and Taiwan red/green market color semantics.
- [x] 4.6 Update dashboard tests for changed markup and interaction controls.

## 5. Remaining Feature Migration

- [x] 5.1 Replace Material cards and icons in Hot Stocks ranking tables while preserving watchlist actions and ranking display.
- [x] 5.2 Replace Material cards and icons in Sector Flow charts, ranking tables, and distribution components.
- [x] 5.3 Replace Material icons in Stock Detail and Backtest Panel while preserving watchlist, assistant, locked-state, and simulation actions.
- [x] 5.4 Replace Material icons in Assistant Panel, Login Required Dialog/Surface, Watchlist, and Goal Simulation components.
- [x] 5.5 Update affected component styles to remove `mat-*`, `.mat-*`, and `.mat-mdc-*` selectors.
- [x] 5.6 Update feature tests whose selectors or rendered markup depended on Angular Material.

## 6. Dependency Removal And Spec Alignment

- [x] 6.1 Remove every `@angular/material/*` import from `apps/web/src`.
- [x] 6.2 Remove every `<mat-*>` element and Material directive usage from Angular templates.
- [x] 6.3 Remove `@angular/material` from `package.json` and `package-lock.json`.
- [x] 6.4 Update `README.md` and `openspec/config.yaml` frontend stack references from Angular Material to PrimeNG.
- [x] 6.5 Search the active specs and implementation for stale Material-specific names and update any remaining references introduced by this change.

## 7. Verification

- [x] 7.1 Run `rg "@angular/material|<mat-|mat-|mat[A-Z]|mat-mdc|Material Icons" apps/web/src package.json README.md openspec/config.yaml`.
- [x] 7.2 Run `npx nx test web`.
- [x] 7.3 Run `npx nx build web`.
- [x] 7.4 Visually verify desktop and mobile layouts for toolbar, dashboard, hot stocks, sector flow, stock detail, watchlist, assistant panel, and goal simulation.
- [x] 7.5 Visually verify light mode, dark mode, date picker overlay, user menu overlay, focus states, and loading/empty states.
