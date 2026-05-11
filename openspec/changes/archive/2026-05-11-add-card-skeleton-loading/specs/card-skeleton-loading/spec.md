## ADDED Requirements

### Requirement: Local Skeleton Rendering
The web app SHALL render layout-matched skeleton placeholders inside data card content while the corresponding card data request is in flight.

#### Scenario: Snapshot card request is loading
- **WHEN** a home snapshot card data request is in flight
- **THEN** the card MUST render skeleton placeholder content instead of text-only loading copy
- **AND** the card header and navigation link MUST remain stable

#### Scenario: Dashboard metric cards are loading
- **WHEN** dashboard market stats are loading
- **THEN** the market stats overview MUST render a grid of metric-card skeletons matching the final stat card layout

#### Scenario: Chart or map container is loading
- **WHEN** a chart or market map data request is in flight
- **THEN** the chart or map card MUST render a fixed-size skeleton container that preserves the eventual visualization area

### Requirement: Explicit Loading State Separation
The web app SHALL distinguish in-flight loading, successful empty data, and request errors for skeleton-enabled cards and tables.

#### Scenario: Request has not completed
- **WHEN** a skeleton-enabled request has started and has not completed
- **THEN** the affected card or table MUST render its skeleton state
- **AND** it MUST NOT render empty-state copy

#### Scenario: Request completes with empty data
- **WHEN** a skeleton-enabled request completes successfully with no rows or no card data
- **THEN** the affected card or table MUST render its existing empty-state copy
- **AND** it MUST NOT render skeleton placeholders

#### Scenario: Request fails
- **WHEN** a skeleton-enabled request fails
- **THEN** the affected card or table MUST render its existing error or warning copy
- **AND** it MUST NOT render skeleton placeholders

### Requirement: Ranking Table Skeletons
Ranking table components SHALL support a loading state that renders table-shaped skeleton rows without showing misleading empty data.

#### Scenario: Hot stocks rankings are loading
- **WHEN** the Hot Stocks page is loading ranking data for the selected date and market
- **THEN** each visible ranking table MUST render skeleton rows
- **AND** it MUST NOT render "暫無資料" until the request completes with an empty ranking

#### Scenario: Sector flow rankings are loading
- **WHEN** the Sector Flow page is loading sector flow data for the selected date and market
- **THEN** the distribution and ranking cards MUST render skeleton rows
- **AND** the detail sections that depend on a selected sector MUST NOT show stale or empty-derived selections as if loading had completed

### Requirement: Global Progress Compatibility
Local skeleton loading SHALL coexist with the existing global progress bar without changing global progress behavior.

#### Scenario: HTTP request is tracked globally and locally
- **WHEN** a normal API request is in flight for a skeleton-enabled card
- **THEN** the global progress bar MAY show according to its existing timing rules
- **AND** the affected card MUST independently render its local skeleton state

#### Scenario: Request settles before global progress appears
- **WHEN** a short request completes before the global progress bar display delay
- **THEN** the card MUST leave skeleton state once the request completes
- **AND** the global progress bar MUST continue to follow its existing no-flicker behavior

### Requirement: Theme And Motion Consistency
Skeleton placeholders SHALL use the app's surface, border, and text-muted visual system and SHALL remain usable in light mode, dark mode, and reduced-motion contexts.

#### Scenario: Dark mode is active
- **WHEN** the app is in dark mode and skeleton-enabled content is loading
- **THEN** skeleton placeholders MUST remain visible against the card background without using market gain/loss semantic colors

#### Scenario: Reduced motion is requested
- **WHEN** the user environment requests reduced motion
- **THEN** skeleton loading animation MUST be disabled or reduced while preserving visible placeholder shapes
