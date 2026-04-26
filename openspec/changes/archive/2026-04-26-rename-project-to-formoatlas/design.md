## Context

The product is currently identified as TaiBaro in user-visible UI surfaces and OpenSpec project context. Its feature set has grown into a date-centered Taiwan equities tool: users select a date, then inspect index mood, chip indicators, sector flow, K-line context, and hot-stock rankings for that day.

The new identity is `FormoAtlas`, with `formoatlas` as the canonical lowercase slug. The Chinese positioning line is:

> 以日期翻閱島嶼股海，讀懂每日留下的紅綠線索。

This change is cross-cutting because it touches UI copy, accessibility text, documentation, metadata, and potentially local package/workspace identifiers. It should not change financial data contracts, routes, database collections, or feature behavior.

## Goals / Non-Goals

**Goals:**
- Present `FormoAtlas` consistently across primary user-visible identity surfaces.
- Standardize `formoatlas` for lowercase technical identifiers where a rename is safe.
- Update documentation so future contributors understand the product as a date-centered atlas for Taiwan equities rather than only a barometer dashboard.
- Preserve all existing app routes, API routes, data schemas, and user workflows.

**Non-Goals:**
- No redesign of the dashboard, sector flow, hot stocks, or date navigation behavior.
- No change to market data ingestion, AI analysis behavior, MongoDB collection names, or REST response schemas.
- No forced breaking environment variable rename. Existing environment variables remain valid unless a compatibility layer is explicitly added.
- No domain, hosting, or deployment account changes in this codebase-only change.

## Decisions

### 1. Use `FormoAtlas` for display, `formoatlas` for slugs

Display surfaces SHOULD use `FormoAtlas` to preserve readability and brand shape. Lowercase identifiers SHOULD use `formoatlas` when the surrounding system expects one token, such as package metadata, internal app metadata, or generated artifact names.

Alternative considered: `formo-atlas`. This is more readable as a generic slug, but the chosen direction treats FormoAtlas as a single coined brand and aligns with the preferred domain shape (`formoatlas.com`).

### 2. Keep route and API names stable

Frontend routes such as `/`, `/sector-flow`, and `/hot-stocks`, plus API routes such as `/marketdata/*`, remain unchanged. These names describe product functions, not the product brand.

Alternative considered: renaming paths to include `formoatlas`. That would create avoidable breaking changes and does not improve the product experience.

### 3. Treat environment variables as compatibility-sensitive

Existing environment variables such as `MONGODB_URI`, `COPILOT_CLI_URL`, `COPILOT_MODEL`, `MARKETDATA_INIT_ENABLED`, and `MARKETDATA_INIT_DAYS` are not brand-specific enough to require migration. If implementation discovers any TaiBaro-prefixed variables, new `FORMOATLAS_` aliases can be added while preserving old names for compatibility.

Alternative considered: globally renaming all environment variables. That would increase deployment risk for little user-visible benefit.

### 4. Update documentation as product positioning, not just search-and-replace

Documentation should describe FormoAtlas as a date-centered atlas of Taiwan equities. This means updating the project overview and README language, not merely replacing `TaiBaro` with `FormoAtlas`.

Alternative considered: mechanical rename only. That would miss the main product positioning change that motivated the rename.

## Risks / Trade-offs

- **Risk: Brand rename accidentally changes runtime identifiers used by Nx or deployment scripts** -> Limit technical renames to metadata and verify build/test commands before applying.
- **Risk: Documentation and UI drift after partial rename** -> Search for `TaiBaro`, `taibaro`, and old positioning text during implementation and classify each hit as user-facing, metadata, or intentionally unchanged.
- **Risk: `formoatlas` is less readable in pure lowercase contexts** -> Use `FormoAtlas` in display copy and keep the lowercase form only where slug consistency matters.
- **Risk: Logo/favicon may still visually imply the old identity** -> Include asset review in tasks; update alt text immediately and replace visual assets only if they are brand-specific.

## Migration Plan

1. Update user-visible identity surfaces first: toolbar, document title/metadata, footer, and accessibility text.
2. Update repository documentation and OpenSpec project context to introduce FormoAtlas and the finalized Chinese positioning line.
3. Review package/workspace metadata for safe local renames to `formoatlas`.
4. Search for old brand strings and decide whether each remaining reference is historical archive content, compatibility-sensitive configuration, or a missed rename.
5. Run affected frontend/API validation. Rollback is a normal revert because no persisted data migration is expected.

## Open Questions

- Should the favicon/logo be redesigned now, or should this change only update textual identity and accessibility text?
- Should archived OpenSpec change documents keep historical `TaiBaro` references, or should only active docs and current specs be updated?
