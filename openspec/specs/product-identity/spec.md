## Purpose

定義 FormoAtlas 的產品名稱、技術 slug、中文定位文案，以及品牌改名時應維持相容的邊界。

## Requirements

### Requirement: Canonical product identity
The system SHALL use `FormoAtlas` as the canonical display name for the product and `formoatlas` as the canonical lowercase slug where a single-token technical identifier is required.

The system SHALL use the Chinese positioning line `以日期翻閱島嶼股海，讀懂每日留下的紅綠線索。` on product-facing surfaces that need a concise description.

#### Scenario: Display name surfaces
- **WHEN** a user-visible surface displays the product name
- **THEN** the surface SHALL display `FormoAtlas`

#### Scenario: Lowercase slug surfaces
- **WHEN** a technical metadata field requires a lowercase project slug
- **THEN** the field SHALL use `formoatlas`

#### Scenario: Chinese positioning surfaces
- **WHEN** a product-facing page, README, or project overview needs a concise positioning statement
- **THEN** it SHALL use `以日期翻閱島嶼股海，讀懂每日留下的紅綠線索。`

### Requirement: Brand rename compatibility boundaries
The system SHALL preserve existing functional routes, API routes, database collection names, and market data response schemas during the rename.

Environment variable renames SHALL NOT remove support for existing environment variable names unless a separate migration explicitly defines the compatibility plan.

#### Scenario: Routes remain stable
- **WHEN** the FormoAtlas identity is applied
- **THEN** existing frontend routes and `/marketdata/*` API routes SHALL continue to work without path changes

#### Scenario: Environment variables remain compatible
- **WHEN** the FormoAtlas identity is applied
- **THEN** existing documented environment variables SHALL remain accepted by the application

### Requirement: Old brand reference review
Implementation SHALL review current-source references to `TaiBaro`, `taibaro`, and old project positioning language, then update user-facing and current documentation references to the FormoAtlas identity.

Historical archive references MAY remain unchanged when they describe completed OpenSpec changes and are not current product-facing documentation.

#### Scenario: Current source references
- **WHEN** implementation searches current application source and documentation
- **THEN** user-facing and current documentation references to the old brand SHALL be updated to FormoAtlas

#### Scenario: Historical archive references
- **WHEN** implementation finds old brand references inside archived OpenSpec change documents
- **THEN** those references MAY remain unchanged if they are historical context and not rendered to users
