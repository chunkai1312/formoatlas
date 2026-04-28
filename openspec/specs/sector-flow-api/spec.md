## Purpose

定義 sector-flow 與 ticker OHLC API 在產業資金流向頁所需的查詢參數、回傳欄位、OTC 支援與資料品質要求。

## Requirements

### Requirement: Sector flow snapshot endpoint
系統 SHALL 提供 `GET /marketdata/sector-flow?date=YYYY-MM-DD` endpoint，支援選填的 `market` query parameter（`TSE` | `OTC`，預設值為 `TSE`），回傳指定市場所有符合條件的產業指數在指定日期的資金流向快照，包含今日與前一個交易日的比較數據及 RS 值。

若 `date` 未指定，預設使用當日日期（`DateTime.local().toISODate()`）。

若 `market` 未指定，系統 SHALL 使用 `TSE`，維持既有行為與向下相容。

**排除指數：**
- `IX0007`（未含金融指數）、`IX0008`（未含電子指數）、`IX0009`（未含金融電子指數）：非產業複合指數
- `IX0013`（水泥窯製類）、`IX0014`（塑膠化工類）、`IX0015`（機電類）、`IX0019`（化學生技醫療類）、`IX0027`（電子工業類）：合併類複合指數，屬下層指數之聚合，不代表獨立產業

當 `market=OTC` 時：
- 查詢 `Market.OTC` 市場的兩個最近交易日資料
- 排除 `IX0043`（TPEX 櫃買指數）：整體基準指數，非獨立產業
- 排除 `IX0047`（TPExElectronic 櫃買電子類）：電子子類的聚合指數，類比 TSE 的 `IX0027`
- 回傳欄位格式與 TSE 相同
- `name` 欄位透過 `getSectorName()` 清理（移除「櫃買」前綴及「類指數」後綴）

回傳欄位（每筆產業）：
- `symbol`：產業指數代號（例如 `IX0028`）
- `name`：產業名稱（已清理，例如「半導體」）
- `date`：資料日期
- `closePrice`：收盤指數點數
- `change`：漲跌點數
- `changePercent`：漲跌幅（%）
- `tradeValue`：今日成交金額（億）
- `tradeValuePrev`：前一交易日成交金額（億）
- `tradeValueChange`：金額差（今日 - 昨日）
- `tradeWeight`：今日成交比重（%）
- `tradeWeightPrev`：前一交易日成交比重（%）
- `tradeWeightChange`：比重差（今日 - 昨日，保留小數精度）
- `rs`：RS 值（`closePrice / TAIEX closePrice`，四捨五入至小數點後 4 位）

**查詢最佳化：** schema 上定義 `{ type: 1, market: 1, date: -1 }` 複合索引。aggregation pipeline 使用 `$project` 只選取必要欄位（`date, symbol, name, closePrice, change, changePercent, tradeValue, tradeWeight`）再進行 `$group`。

#### Scenario: Query with valid date
- **WHEN** client sends `GET /marketdata/sector-flow?date=2026-03-13`
- **THEN** system returns HTTP 200 with array of all qualifying TSE sector indices records（資料未排序，排序由前端控制）

#### Scenario: OTC sector flow query
- **WHEN** client sends `GET /marketdata/sector-flow?date=2026-03-13&market=OTC`
- **THEN** system returns HTTP 200 with array of 23 OTC sector indices records（排除 `IX0043`、`IX0047`）

#### Scenario: Query without date parameter
- **WHEN** client sends `GET /marketdata/sector-flow` (no date param)
- **THEN** system uses today's date and returns the same structure

#### Scenario: Default market is TSE
- **WHEN** client sends `GET /marketdata/sector-flow?date=2026-03-13` (no market param)
- **THEN** system returns TSE sectors, behavior unchanged from before

#### Scenario: Non-trading day query
- **WHEN** client sends a date that has no trading data (e.g., weekend)
- **THEN** API returns the most recent available trading day's data (using `$lte date` semantics)
- **AND** the frontend (`TickerService`) filters out records whose `date` field differs from the requested date, resulting in an empty array displayed to the user

#### Scenario: OTC non-trading day query
- **WHEN** client sends OTC query for a non-trading day
- **THEN** API returns most recent available OTC trading day data using `$lte date` semantics
- **AND** the frontend filters out the response, displaying empty state to the user

#### Scenario: OTC name cleaning
- **WHEN** OTC sector data returns name `"櫃買半導體類指數"`
- **THEN** `name` field in response is `"半導體"`

#### Scenario: TAIEX data missing
- **WHEN** TAIEX (`IX0001`) record is absent for the queried date
- **THEN** system returns records with `rs: null` for all sectors (does not crash)

### Requirement: Sector OHLC time series with tradeWeight
系統 SHALL 在 `GET /marketdata/tickers?symbol=IX0028&startDate=...&endDate=...` 的回傳欄位中包含 `tradeWeight`，供前端產業資金流向趨勢圖使用。

#### Scenario: Ticker OHLC with tradeWeight
- **WHEN** client queries `GET /marketdata/tickers?symbol=IX0028&startDate=2026-01-01&endDate=2026-03-13`
- **THEN** each record in the response SHALL include `tradeWeight` field alongside existing OHLC fields
