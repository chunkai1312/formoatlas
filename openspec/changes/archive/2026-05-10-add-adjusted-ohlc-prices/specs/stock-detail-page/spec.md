## ADDED Requirements

### Requirement: Stock detail adjusted kline toggle
Stock detail page SHALL provide a price basis toggle for the stock K-line chart with options for raw price and adjusted price.

The raw price option SHALL request OHLC data without `adjusted=true`.

The adjusted price option SHALL request OHLC data with `adjusted=true`.

The chart SHALL preserve existing Taiwan red-up green-down candlestick semantics for both price bases.

#### Scenario: Default stock kline price basis
- **WHEN** user opens a stock detail page
- **THEN** the stock K-line chart SHALL render with a stable default price basis
- **AND** the selected basis SHALL be visible in the chart controls

#### Scenario: Switch to adjusted stock kline
- **WHEN** user selects the adjusted price basis on `/stocks/2330`
- **THEN** the web app SHALL request OHLC for `2330` with `adjusted=true`
- **AND** the stock K-line chart SHALL render the returned adjusted OHLC

#### Scenario: Switch back to raw stock kline
- **WHEN** user selects the raw price basis after viewing adjusted price
- **THEN** the web app SHALL request OHLC without `adjusted=true`
- **AND** the stock K-line chart SHALL render raw OHLC

#### Scenario: Preserve chart behavior across price basis changes
- **WHEN** user switches between raw and adjusted price basis
- **THEN** the K-line chart SHALL keep its existing date range, MA display behavior, tooltip behavior, and red-up green-down colors
