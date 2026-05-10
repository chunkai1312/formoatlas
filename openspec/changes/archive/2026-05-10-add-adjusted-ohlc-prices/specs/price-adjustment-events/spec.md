## ADDED Requirements

### Requirement: Price adjustment event storage
The system SHALL store price adjustment events in a dedicated collection named for `PriceAdjustmentEvent`.

Each event SHALL include `symbol`, `exchange`, `market`, `eventType`, `effectiveDate`, `previousClose`, `referencePrice`, `factor`, and `raw`.

The system SHALL preserve each source event separately, including multiple events for the same symbol and effective date.

#### Scenario: Store normalized dividend event
- **WHEN** the system ingests a dividend source row for symbol `0050`
- **THEN** the system SHALL persist a `PriceAdjustmentEvent` with `eventType: dividend`, a normalized `effectiveDate`, a precomputed `factor`, and the original row in `raw`

#### Scenario: Store multiple same-day events
- **WHEN** the system ingests two adjustment events for the same symbol and effective date
- **THEN** the system SHALL persist both events separately
- **AND** SHALL NOT merge them into a single event record

### Requirement: Price adjustment event source synchronization
The system SHALL synchronize price adjustment events from `node-twstock`.

The system SHALL use `stocks.dividends()`, `stocks.capitalReductions()`, `stocks.splits()`, and `stocks.etfSplits()` for both split and reverse split data.

The system SHALL support daily synchronization through the scheduled update methods and SHALL allow callers to update a specified date by passing a date argument to those methods.

#### Scenario: Daily synchronization
- **WHEN** the daily market data update runs
- **THEN** the system SHALL fetch supported price adjustment events for the update date
- **AND** SHALL upsert normalized events without duplicating previously stored events

#### Scenario: Manual date synchronization
- **WHEN** an operator or initializer calls a price adjustment event update method with a specific date
- **THEN** the system SHALL fetch supported price adjustment events for that date
- **AND** SHALL upsert normalized events into the price adjustment event collection

#### Scenario: ETF reverse split synchronization
- **WHEN** the system synchronizes ETF split events
- **THEN** it SHALL call the ETF split source with reverse split disabled and enabled
- **AND** SHALL distinguish `etfSplit` from `etfReverseSplit` in `eventType`

### Requirement: Price adjustment factor calculation
The system SHALL precompute and persist a numeric `factor` for each valid price adjustment event.

For dividend events, the system SHALL combine cash dividend and stock dividend effects into a single factor.

For capital reduction, face value change, ETF split, and ETF reverse split events, the system SHALL calculate factor as `referencePrice / previousClose`.

#### Scenario: Dividend factor
- **WHEN** a dividend event has `previousClose`, `cashDividend`, and `stockDividendShares`
- **THEN** the system SHALL compute `factor` as `(1 - cashDividend / previousClose) * (1 / (1 + stockDividendShares / 1000))`

#### Scenario: Reference price factor
- **WHEN** a capital reduction, face value change, ETF split, or ETF reverse split event has valid `previousClose` and `referencePrice`
- **THEN** the system SHALL compute `factor` as `referencePrice / previousClose`

#### Scenario: Invalid source values
- **WHEN** a source event lacks valid values required to compute factor
- **THEN** the system SHALL NOT persist an event with an invalid numeric factor
- **AND** SHALL record or surface enough context for operational troubleshooting

### Requirement: Price adjustment event lookup
The system SHALL provide a repository lookup for events by symbol and effective date range.

The lookup SHALL return events sorted by `effectiveDate` ascending and SHALL include events needed to adjust candles in the requested OHLC range.

#### Scenario: Lookup events for adjusted OHLC
- **WHEN** adjusted OHLC calculation requests events for symbol `2330` through `2026-05-10`
- **THEN** the repository SHALL return all stored events for `2330` whose `effectiveDate` is on or before the requested end date
