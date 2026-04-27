## ADDED Requirements

### Requirement: Latest trading date before given date
系統 SHALL 提供 API endpoint `GET /api/marketdata/trading-date?before=<date>`，回傳 `before` 當天或之前最近一筆 market-stats 記錄的日期。

#### Scenario: Query on a trading day
- **WHEN** `before` 為有 market-stats 記錄的交易日
- **THEN** 系統回傳 `{ "date": "<before>" }`

#### Scenario: Query on a weekend or holiday
- **WHEN** `before` 為週末或國定假日（無 market-stats 記錄）
- **THEN** 系統回傳距離 `before` 最近、且在其之前的交易日 `{ "date": "<closest-past-trading-day>" }`

#### Scenario: No data exists before given date
- **WHEN** `before` 早於所有 market-stats 記錄
- **THEN** 系統回傳 404 錯誤
