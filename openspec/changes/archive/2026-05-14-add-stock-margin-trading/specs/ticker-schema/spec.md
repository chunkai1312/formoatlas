## ADDED Requirements

### Requirement: Ticker schema defines marginTrading sub-document
`Ticker` document 中的個股融資融券資料 SHALL 以 optional `marginTrading` sub-document 組織。`marginTrading` SHALL only be used for equity ticker rows and SHALL include stock-level margin trading quantities in the unit returned by `node-twstock.stocks.marginTrades()`.

`marginTrading` SHALL include:
- `marginBuy`
- `marginSell`
- `marginRedeem`
- `marginBalancePrev`
- `marginBalance`
- `marginBalanceChange`
- `marginQuota`
- `shortBuy`
- `shortSell`
- `shortRedeem`
- `shortBalancePrev`
- `shortBalance`
- `shortBalanceChange`
- `shortQuota`
- `offset`
- `note`

#### Scenario: Equity Ticker writes margin trading data
- **WHEN** 系統執行個股融資融券更新
- **THEN** 資料以 `marginTrading` sub-document 寫入對應的 equity `Ticker` document
- **AND** `marginBalanceChange` equals `marginBalance - marginBalancePrev`
- **AND** `shortBalanceChange` equals `shortBalance - shortBalancePrev`

#### Scenario: Ticker without margin trading data remains valid
- **WHEN** 查詢尚未寫入個股融資融券資料的 `Ticker` document
- **THEN** 該 document MAY omit `marginTrading`
- **AND** 系統不會因缺少 `marginTrading` 而視為資料格式錯誤

### Requirement: Ticker ingestion stores TWSE and TPEx stock margin trading rows
系統 SHALL 使用 `node-twstock.stocks.marginTrades({ date, exchange })` 取得 TWSE 與 TPEx 個股融資融券資料，並 SHALL 以 `{ date, symbol }` upsert 至既有 `Ticker` document。

#### Scenario: TWSE margin trading batch update
- **WHEN** 系統更新指定日期的 TWSE 個股融資融券資料
- **THEN** 系統呼叫 `stocks.marginTrades` with `exchange: 'TWSE'`
- **AND** 每筆回傳資料寫入 `market: TSE` and `exchange: TWSE` 的 equity ticker row

#### Scenario: TPEx margin trading batch update filters warrants
- **WHEN** 系統更新指定日期的 TPEx 個股融資融券資料
- **THEN** 系統呼叫 `stocks.marginTrades` with `exchange: 'TPEx'`
- **AND** 系統排除符合上櫃權證代號規則的 rows
- **AND** 其餘資料寫入 `market: OTC` and `exchange: TPEx` 的 equity ticker row

#### Scenario: Non-trading date margin trading update
- **WHEN** `stocks.marginTrades` returns no data for a date
- **THEN** 系統不建立空的 `Ticker` margin trading document
- **AND** 系統保留既有 ticker data without throwing an update failure
