## Why

TaiBaro has evolved from a market chip dashboard into a date-centered Taiwan equities review tool that lets users revisit each trading day through index, sector, institutional, and hot-stock signals. The product needs a clearer, more memorable identity that expresses this differentiated use case without sounding like a generic analysis platform.

## What Changes

- Rename the product identity from `TaiBaro` to `FormoAtlas`.
- Establish the canonical Chinese positioning line: `以日期翻閱島嶼股海，讀懂每日留下的紅綠線索。`
- Standardize technical and public naming around `formoatlas` where a lowercase slug is required.
- Update visible app identity surfaces, including toolbar title/logo alt text, document metadata, footer copyright, README/project documentation, and OpenSpec project context.
- Keep existing feature routes and user workflows unchanged; this change is a branding and identity migration, not a navigation or data-model redesign.
- Defer risky infrastructure renames unless they are low-risk and local. Environment variable migrations should be explicitly evaluated before implementation and should preserve backward compatibility when changed.

## Capabilities

### New Capabilities
- `product-identity`: Defines canonical product name, slug, Chinese positioning, and identity surfaces that must present the FormoAtlas brand consistently.

### Modified Capabilities
- `topbar-navigation`: Updates the TopBar product title and logo accessibility text to use the FormoAtlas identity while preserving existing navigation links and active states.
- `web-dashboard`: Updates global layout identity surfaces such as footer copyright and user-visible product references.

## Impact

- **Frontend UI**: Toolbar title, logo alt text, footer copyright, document title/metadata, favicon/logo references if applicable.
- **Documentation**: README, OpenSpec project context, and any product-facing docs that currently describe TaiBaro.
- **Configuration / metadata**: Package/workspace metadata and app names that can be safely renamed to `formoatlas` without breaking local development.
- **Compatibility**: Existing API routes, frontend routes, database collections, and data contracts remain unchanged unless a later implementation task identifies a low-risk metadata-only rename.
