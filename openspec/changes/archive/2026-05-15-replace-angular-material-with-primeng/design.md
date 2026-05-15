## Context

The Angular web app currently uses Angular Material as both a component library and a theme foundation. Material imports appear across dashboard, navigation, assistant, watchlist, stock detail, hot stocks, sector flow, and goal simulation UI. Global styling also depends on `@angular/material` Sass APIs to generate light and dark component themes.

PrimeNG 21 is compatible with the app's Angular 21 line and provides replacements for the Material component categories currently in use: cards, buttons, menus, date picker, tabs, chips/tags/selectors, progress spinner, and icons via PrimeIcons. PrimeNG currently still declares `@angular/cdk` as a peer dependency, so the migration target is to remove `@angular/material`, not necessarily to remove every `@angular/cdk` package entry.

## Goals / Non-Goals

**Goals:**

- Use PrimeNG as the app's primary UI framework.
- Remove all `@angular/material` imports, templates, directives, Sass APIs, and Material icon font usage from the web app.
- Preserve existing user-facing behavior for navigation, date selection, dark mode, dashboard controls, loading states, empty states, and authenticated actions.
- Rebuild light/dark UI styling with PrimeNG theme configuration plus the existing FormoAtlas CSS token system.
- Keep the resulting implementation compatible with standalone Angular components and Nx web build/test targets.

**Non-Goals:**

- Redesign the product information architecture, routes, or chart interactions.
- Change backend APIs or data contracts.
- Replace ngx-echarts or rewrite chart rendering.
- Guarantee removal of `@angular/cdk` if PrimeNG requires it as a peer dependency.
- Introduce a second UI framework alongside PrimeNG for general app controls.

## Decisions

### Adopt PrimeNG as the primary component dependency

Install PrimeNG and PrimeIcons, configure PrimeNG providers in the Angular application config, and import PrimeNG standalone modules/components directly in feature components.

Alternatives considered:

- Keep Angular Material and only adjust styling. This preserves the current implementation but fails the dependency and framework migration goal.
- Replace Material with app-owned HTML/CSS primitives only. This would remove more dependencies, but it would require rebuilding complex controls such as date picker, menu, tabs, and accessible selection controls.

### Remove Angular Material completely from application code

All imports from `@angular/material/*`, all `<mat-*>` elements, Material directives such as `mat-button` and `matMenuTriggerFor`, Material Sass mixins, and the Google Material Icons font link SHALL be removed.

PrimeNG replacement mapping:

| Angular Material usage | PrimeNG / app replacement |
| --- | --- |
| `MatCard` | `p-card` or app-owned surface markup using PrimeNG theme tokens |
| `MatIcon` | PrimeIcons classes such as `pi pi-*` |
| `MatToolbar` | app-owned toolbar layout with PrimeNG buttons/menu controls |
| `MatButton`, `MatIconButton` | PrimeNG `Button` |
| `MatDatepicker` | PrimeNG DatePicker |
| `MatMenu` | PrimeNG Menu, Popover, or TieredMenu based on existing interaction |
| `MatTabGroup` / `MatTab` | PrimeNG Tabs |
| `MatChip` / `MatChipListbox` | PrimeNG Tag, Chip, SelectButton, or app-owned segmented controls |
| `MatProgressSpinner` | PrimeNG ProgressSpinner |

### Preserve FormoAtlas tokens as the semantic design layer

PrimeNG themes will provide component base styling and interaction states. Existing CSS custom properties such as `--bg-page`, `--bg-surface`, `--text-primary`, `--toolbar-bg`, and market-color tokens remain the app-level semantic layer.

Dark mode continues to be controlled by `html.dark-mode` because the current `ThemeService`, tests, and global styles already use that contract. PrimeNG dark theme configuration should be wired to the same class selector or equivalent runtime theme switch so that PrimeNG overlays and components follow the selected mode.

### Prefer behavior-preserving component swaps

The migration is not a visual redesign. Each screen should keep its current hierarchy and workflows:

- Toolbar brand link, nav active states, watchlist login gating, theme toggle, date navigation, and user menu remain intact.
- Dashboard hero, K-line card, stat cards, trend tabs, and range selectors remain in the same page order.
- Hot stocks, sector flow, stock detail, watchlist, assistant panel, login-required surfaces, and goal simulation keep existing command flows and states.

Any visual differences introduced by PrimeNG defaults should be normalized with local SCSS and shared tokens.

### Treat icon migration as an explicit mapping task

Material icon names do not map one-to-one to PrimeIcons. Implementation should replace icon usage deliberately, verifying each command still has a recognizable symbol and accessible label. The Material Icons font link in `index.html` should be removed only after all `<mat-icon>` usage is gone.

## Risks / Trade-offs

- [Risk] PrimeNG's `@angular/cdk` peer dependency prevents full CDK removal -> Mitigation: define the dependency goal as removing Angular Material while retaining CDK only when required by PrimeNG.
- [Risk] Theme regressions in overlays such as date picker and menu -> Mitigation: verify light/dark mode for inline components and overlay components separately.
- [Risk] Accessibility regressions from icon/button/menu swaps -> Mitigation: preserve existing `aria-label` contracts and add focused tests for toolbar and login-gated actions.
- [Risk] Visual drift across cards and dashboard controls -> Mitigation: keep FormoAtlas CSS tokens as the shared semantic layer and normalize PrimeNG defaults in global/component styles.
- [Risk] Mechanical replacement can break dashboard chart controls -> Mitigation: migrate one feature cluster at a time and run web tests/build after each cluster where practical.

## Migration Plan

1. Add PrimeNG, PrimeIcons, and PrimeNG theme configuration; keep the app building with Material still present.
2. Replace global Material theme Sass usage with PrimeNG theme setup and FormoAtlas CSS token styling.
3. Migrate toolbar controls: brand/nav links, date picker, theme toggle, user menu, login button, and icons.
4. Migrate dashboard components: hero card, stat cards, K-line card, trend tabs, chip/select controls, spinner/loading states, and icons.
5. Migrate remaining Material usage in hot stocks, sector flow, stock detail, assistant panel, login-required surfaces, watchlist, and goal simulation.
6. Remove Material icon font from `index.html`.
7. Remove `@angular/material` from dependencies and package lock; keep `@angular/cdk` only if PrimeNG still requires it.
8. Update tests for changed markup and run `npx nx test web` and `npx nx build web`.

Rollback strategy: keep the migration in a single OpenSpec change and avoid backend changes. If the UI migration proves unstable, revert the change branch before removing Material dependencies, or temporarily keep both libraries during early implementation checkpoints while ensuring the final state contains no Material application usage.

## Open Questions

- Should card surfaces use `p-card` everywhere, or should repeated market dashboard cards use app-owned surface markup styled with PrimeNG tokens to reduce generated DOM and simplify chart layouts?
- Should the trend indicator selector use PrimeNG `SelectButton`, `Tabs`, or an app-owned segmented control for the closest match to the current chip list behavior?

## Resolved Decisions During Implementation

- PrimeNG Aura is the default preset. Dark mode is wired through the existing `html.dark-mode` selector so the current `ThemeService` remains the single source of truth.
