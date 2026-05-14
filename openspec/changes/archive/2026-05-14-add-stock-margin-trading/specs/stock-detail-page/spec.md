## ADDED Requirements

### Requirement: Stock detail page presents margin trading context
Stock detail page SHALL present per-stock margin trading context when `stock-summary.marginTrading` is available.

The margin trading section SHALL include:
- margin balance and margin balance change
- short balance and short balance change
- margin buy and sell activity
- short sell and buy activity
- offset
- margin trading note when present

#### Scenario: Render margin trading metrics
- **WHEN** stock summary contains `marginTrading`
- **THEN** the stock detail page displays margin and short balance metrics
- **AND** the page displays financing and short activity metrics

#### Scenario: Render margin trading note
- **WHEN** stock summary `marginTrading.note` is a non-empty string
- **THEN** the stock detail page displays the note near the margin trading metrics

#### Scenario: Margin trading data unavailable
- **WHEN** stock summary `marginTrading` is `null`
- **THEN** the stock detail page still renders the stock summary
- **AND** the page presents a neutral empty state for margin trading context
