## Purpose
定義 `Ticker` 文件中三大法人籌碼 sub-document 的資料結構、optional 欄位語意與依法人淨買賣超排名查詢的 dotted path 使用方式，避免指數與個股資料結構混淆。
## Requirements
### Requirement: Ticker schema 定義 instInvestors sub-document
`Ticker` document 中的三大法人籌碼資料 SHALL 以 `instInvestors` sub-document 組織，結構為三個機構（`fini`、`sitc`、`dealers`）各自含 `buy`（買超量）、`sell`（賣超量）、`net`（淨買賣超）三個欄位。`instInvestors` 欄位 SHALL 為 optional，以反映指數類 Ticker 不含籌碼資料的事實。

#### Scenario: Equity Ticker 寫入三大法人詳細資料
- **WHEN** 系統執行個股三大法人買賣超更新
- **THEN** 資料以 `{ instInvestors: { fini: { buy, sell, net }, sitc: { buy, sell, net }, dealers: { buy, sell, net } } }` 格式寫入對應的 Ticker document

#### Scenario: Index Ticker 不含籌碼資料
- **WHEN** 查詢指數類 Ticker document
- **THEN** 該 document 不含 `instInvestors` 欄位，且不含舊的頂層籌碼欄位

#### Scenario: 依三大法人淨買賣超排名查詢
- **WHEN** 呼叫 `getInstInvestorsTrades` 並指定機構別（fini/sitc/dealers）與方向（buy/sell）
- **THEN** 系統使用 `instInvestors.${inst}.net` dotted path 進行篩選與排序，並回傳正確結果

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

### Requirement: Ticker schema preserves stock institutional trading detail rows
`Ticker` document 中的個股法人進出資料 SHALL store institutional investor summary and source-level rows in an optional `institutionalTrading` sub-document for equity ticker rows.

`institutionalTrading.summary` SHALL include:
- `fini`
- `sitc`
- `dealers`

Each summary item SHALL include `buy`, `sell`, `net`, and MAY include `consecutiveDays`.

`institutionalTrading.details` SHALL be an ordered array. Each detail row SHALL include:
- `investor`
- `buy`
- `sell`
- `net`

`institutionalTrading.details[].buy` and `institutionalTrading.details[].sell` SHALL allow `null` when the source row provides only a net value.

Ticker documents SHALL NOT store the legacy top-level `instInvestors` field.

#### Scenario: Equity Ticker writes preserved institutional rows
- **WHEN** 系統執行個股三大法人買賣超更新
- **THEN** 資料以 `institutionalTrading.details` 保存來源回傳的法人明細列
- **AND** 每筆 row includes the source investor label and net value
- **AND** rows with source buy or sell values include those values

#### Scenario: Aggregate institutional fields remain available
- **WHEN** 系統寫入 `institutionalTrading`
- **THEN** 系統 SHALL write `institutionalTrading.summary.fini`, `institutionalTrading.summary.sitc`, and `institutionalTrading.summary.dealers`
- **AND** those aggregates SHALL be derived from the same mapped source rows written to `institutionalTrading.details`
- **AND** 系統 SHALL NOT write top-level `instInvestors`

#### Scenario: Rows with net-only source values
- **WHEN** a source institutional row contains `difference` but no buy or sell values
- **THEN** the preserved row SHALL set `net` from `difference`
- **AND** the preserved row SHALL set missing `buy` and `sell` values to `null`

#### Scenario: Ticker without preserved institutional details remains valid
- **WHEN** 查詢尚未寫入 `institutionalTrading` 的 historical `Ticker` document
- **THEN** 該 document MAY omit `institutionalTrading`
- **AND** stock summary institutional aggregate fields SHALL resolve to `null`
- **AND** stock summary institutional details SHALL resolve to an empty array

### Requirement: Ticker ingestion stores TWSE and TPEx stock institutional detail rows
系統 SHALL use `node-twstock.stocks.institutional({ date, exchange })` for TWSE and TPEx equity institutional ingestion and SHALL preserve each stock's returned institutional rows in `Ticker.institutionalTrading`.

#### Scenario: TWSE institutional batch update preserves details
- **WHEN** 系統更新指定日期的 TWSE 個股法人進出資料
- **THEN** 系統 SHALL call `stocks.institutional` with `exchange: 'TWSE'`
- **AND** 每筆回傳資料 writes `market: TSE` and `exchange: TWSE`
- **AND** each ticker update includes `institutionalTrading`

#### Scenario: TPEx institutional batch update preserves details and filters warrants
- **WHEN** 系統更新指定日期的 TPEx 個股法人進出資料
- **THEN** 系統 SHALL call `stocks.institutional` with `exchange: 'TPEx'`
- **AND** 系統 SHALL exclude rows matching the OTC warrant symbol rules
- **AND** each remaining ticker update includes `institutionalTrading`

#### Scenario: Non-trading date institutional update
- **WHEN** `stocks.institutional` returns no data for a date
- **THEN** 系統 SHALL NOT create empty `institutionalTrading` documents
- **AND** 系統 SHALL keep existing ticker data without throwing an update failure

