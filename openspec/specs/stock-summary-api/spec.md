## ADDED Requirements

### Requirement: Stock summary aggregate endpoint
系統 SHALL 提供 `GET /marketdata/stock-summary?symbol=<symbol>&date=YYYY-MM-DD` endpoint，一次回傳單一股票在指定日期脈絡下的個股摘要。

若 `date` 未指定，系統 SHALL 使用當日日期（`DateTime.local().toISODate()`）。

若指定日期沒有該股票資料，但小於等於指定日期存在較近交易日資料，系統 SHALL 使用該較近交易日資料回傳，並同時包含 `requestedDate` 與實際資料 `date`。

若找不到指定 symbol 的 equity ticker 資料，系統 SHALL 回傳 not found response。

Response SHALL 包含：
- `requestedDate`：client 要求日期
- `date`：實際回傳資料日期
- `symbol`：股票代號
- `name`：股票名稱
- `market`：`TSE` 或 `OTC`
- `exchange`：交易所代碼
- `industryCode`：產業代碼，無資料時為 `null`
- `industryName`：產業名稱，無資料時為 `null`
- `quote`：該日量價摘要
- `institutional`：三大法人與連續買賣超摘要
- `ohlc`：近期 OHLC 序列
- `context`：輕量市場脈絡

#### Scenario: Query stock summary on trading date
- **WHEN** client sends `GET /marketdata/stock-summary?symbol=2330&date=2026-04-30`
- **THEN** API returns HTTP 200 with stock summary for `2330`
- **AND** `requestedDate` is `2026-04-30`
- **AND** `date` is the actual equity data date used for the response

#### Scenario: Query stock summary without date
- **WHEN** client sends `GET /marketdata/stock-summary?symbol=2330`
- **THEN** API uses today's local ISO date as `requestedDate`

#### Scenario: Query stock summary for non-trading date
- **WHEN** client requests a date that has no ticker row for the symbol but prior rows exist
- **THEN** API returns the nearest available ticker row on or before the requested date
- **AND** API exposes the mismatch through distinct `requestedDate` and `date` fields

#### Scenario: Query unknown stock
- **WHEN** client requests a symbol that cannot be resolved from equity metadata or ticker equity rows
- **THEN** API returns not found

### Requirement: Stock summary quote and OHLC fields
Stock summary response SHALL expose quote and OHLC fields using existing `Ticker` data.

`quote` SHALL include:
- `openPrice`
- `highPrice`
- `lowPrice`
- `closePrice`
- `change`
- `changePercent`
- `tradeVolume`
- `tradeValue`
- `transaction`

`ohlc` SHALL include recent daily rows sorted ascending by date. Each OHLC row SHALL include `date`, `openPrice`, `highPrice`, `lowPrice`, `closePrice`, `tradeValue`, and `tradeVolume`.

若 OHLC range 未指定，系統 SHALL return a bounded recent range suitable for the stock detail chart.

#### Scenario: Stock summary includes quote
- **WHEN** API returns a stock summary
- **THEN** `quote` contains the latest available daily quote fields for the response `date`

#### Scenario: Stock summary includes OHLC series
- **WHEN** API returns a stock summary
- **THEN** `ohlc` contains bounded recent rows for the requested symbol
- **AND** rows are sorted by `date` ascending

### Requirement: Stock summary institutional fields
Stock summary response SHALL expose institutional investor data from `Ticker.instInvestors` when available.

`institutional` SHALL include:
- `finiNet`
- `sitcNet`
- `dealersNet`
- `finiConsecutiveDays`
- `sitcConsecutiveDays`

若法人資料尚未寫入，institutional fields SHALL use `null` rather than causing the API to fail.

#### Scenario: Institutional data available
- **WHEN** the ticker row contains `instInvestors`
- **THEN** API projects foreign, investment trust, and dealer net fields
- **AND** API projects foreign and investment trust consecutive-day fields

#### Scenario: Institutional data missing
- **WHEN** the ticker row has quote data but no `instInvestors`
- **THEN** API still returns HTTP 200
- **AND** institutional fields are `null`

### Requirement: Stock summary market context
Stock summary response SHALL include lightweight context derived from existing FormoAtlas data.

`context` SHALL include:
- `appearsInHotStocks`：是否出現在任一 V1 hot-stocks top-20 list
- `hotStockLists`：出現的熱門股排行清單識別
- `marketCap`：可由 `Equity.issuedShares * closePrice` 計算時回傳，否則為 `null`
- `tradeValue`：該日成交值
- `sectorTradeValue`：可由相同產業與市場彙總時回傳，否則為 `null`
- `sectorWeightByTradeValue`：可計算時回傳，否則為 `null`

V1 context SHALL NOT require full market percentile ranks or same-industry historical ranks.

#### Scenario: Stock appears in hot stocks ranking
- **WHEN** the stock is present in one or more hot-stocks top-20 lists for the response date and market
- **THEN** `appearsInHotStocks` is `true`
- **AND** `hotStockLists` lists the matching ranking categories

#### Scenario: Stock does not appear in hot stocks ranking
- **WHEN** the stock is not present in any hot-stocks top-20 list
- **THEN** `appearsInHotStocks` is `false`
- **AND** `hotStockLists` is empty

#### Scenario: Market cap cannot be calculated
- **WHEN** equity metadata lacks `issuedShares` or quote lacks `closePrice`
- **THEN** `marketCap` is `null`
- **AND** API still returns the rest of the stock summary

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
