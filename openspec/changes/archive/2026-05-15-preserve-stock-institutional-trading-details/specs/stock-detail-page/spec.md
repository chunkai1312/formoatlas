## ADDED Requirements

### Requirement: Stock detail page presents institutional trading detail rows
Stock detail page SHALL present row-level institutional trading details when `stock-summary.institutional.details` is available.

The institutional detail view SHALL display:
- investor label
- buy value when available
- sell value when available
- net value

#### Scenario: Render institutional detail rows
- **WHEN** stock summary contains one or more `institutional.details` rows
- **THEN** the stock detail page displays those rows in the institutional section
- **AND** each row includes investor label and net value

#### Scenario: Render unavailable buy or sell values
- **WHEN** an institutional detail row has `buy: null` or `sell: null`
- **THEN** the stock detail page displays a neutral placeholder for that unavailable value
- **AND** the page still displays the row's net value

#### Scenario: Legacy stock summary without institutional details
- **WHEN** stock summary `institutional.details` is empty
- **THEN** the stock detail page keeps existing institutional summary metrics visible when available
- **AND** the detail view presents a neutral empty state without failing
