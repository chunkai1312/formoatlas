## ADDED Requirements

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
