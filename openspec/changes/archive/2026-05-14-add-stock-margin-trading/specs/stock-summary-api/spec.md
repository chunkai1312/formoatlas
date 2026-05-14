## ADDED Requirements

### Requirement: Stock summary margin trading fields
Stock summary response SHALL expose per-stock margin trading data from `Ticker.marginTrading` when available.

Response SHALL include `marginTrading`, whose value SHALL be either `null` or an object containing:
- `marginBalance`
- `marginBalanceChange`
- `shortBalance`
- `shortBalanceChange`
- `marginBuy`
- `marginSell`
- `marginRedeem`
- `shortBuy`
- `shortSell`
- `shortRedeem`
- `offset`
- `note`

若 margin trading data 尚未寫入，`marginTrading` SHALL be `null` rather than causing the API to fail.

#### Scenario: Margin trading data available
- **WHEN** `GET /marketdata/stock-summary?symbol=2330&date=2026-05-12` resolves a ticker row containing `marginTrading`
- **THEN** API returns HTTP 200
- **AND** response `marginTrading` includes margin balance, short balance, activity, offset, and note fields

#### Scenario: Margin trading data missing
- **WHEN** the resolved ticker row has quote data but no `marginTrading`
- **THEN** API returns HTTP 200
- **AND** response `marginTrading` is `null`

#### Scenario: Non-trading date uses nearest ticker row margin trading
- **WHEN** client requests a date that has no ticker row for the symbol but a prior row exists
- **THEN** API uses the same nearest available ticker row selected for the stock summary
- **AND** response `marginTrading` reflects that actual response `date` when available
