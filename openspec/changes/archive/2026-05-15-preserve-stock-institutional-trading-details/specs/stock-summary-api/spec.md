## ADDED Requirements

### Requirement: Stock summary institutional detail rows
Stock summary response SHALL expose stock institutional summary fields from `Ticker.institutionalTrading.summary` and preserved detail rows from `Ticker.institutionalTrading.details` when available.

The `institutional` object SHALL continue to include existing summary fields:
- `finiNet`
- `sitcNet`
- `dealersNet`
- `finiConsecutiveDays`
- `sitcConsecutiveDays`

The `institutional` object SHALL additionally include `details`, an array of rows containing:
- `investor`
- `buy`
- `sell`
- `net`

When `Ticker.institutionalTrading` is missing, institutional summary fields SHALL be `null` and `institutional.details` SHALL be an empty array rather than causing the API to fail.

#### Scenario: Stock summary includes institutional detail rows
- **WHEN** `GET /marketdata/stock-summary` resolves a ticker row containing `institutionalTrading.summary` and `institutionalTrading.details`
- **THEN** response `institutional.details` SHALL include the preserved investor rows
- **AND** response `institutional.finiNet`, `institutional.sitcNet`, and `institutional.dealersNet` fields SHALL be projected from `institutionalTrading.summary`

#### Scenario: Stock summary handles net-only detail rows
- **WHEN** a preserved institutional detail row has `buy: null` or `sell: null`
- **THEN** stock summary SHALL return the row with null buy or sell values
- **AND** stock summary SHALL still include the row's net value

#### Scenario: Stock summary with no institutional data
- **WHEN** the resolved ticker row has no `institutionalTrading`
- **THEN** stock summary SHALL return institutional summary fields as `null`
- **AND** response `institutional.details` SHALL be an empty array
