# market-heatmap Specification

## Purpose
提供首頁市場熱力圖功能的規格，包含後端資料端點、個股靜態資訊儲存與前端 treemap 視覺化。

## Requirements

### Requirement: 市場熱力圖資料端點
系統 SHALL 提供 `GET /marketdata/market-map?date=YYYY-MM-DD&market=TSE` endpoint，回傳以產業為父節點、個股為子節點的階層化熱力圖資料，僅限 TSE 普通股（排除 ETF、基金等非普通股類型）。

若 `date` 未指定，系統 SHALL 使用當日日期。
若 `market` 未指定，系統 SHALL 預設使用 `TSE`。
若指定日期無 Ticker 資料，API SHALL 使用最近一個小於等於指定日期且有個股資料的交易日，但前端（`TickerService`）SHALL 比對回傳的 `date` 欄位與請求日期是否相符；若不符，前端 SHALL 以 `sectors: []` 呈現空狀態，而非顯示前一交易日的資料。

#### Scenario: 查詢 TSE 熱力圖資料
- **WHEN** client 送出 `GET /marketdata/market-map?date=2026-04-24&market=TSE`
- **THEN** 系統 SHALL 回傳 HTTP 200，包含 `date`、`market`、`sectors` 陣列
- **AND** `sectors` 的每個產業物件 SHALL 包含 `industryCode`、`name`、`totalMarketCap`、`stocks` 陣列
- **AND** `stocks` 的每個個股物件 SHALL 包含 `symbol`、`name`、`marketCap`、`changePercent`、`openPrice`、`highPrice`、`lowPrice`、`closePrice`、`tradeVolume`

#### Scenario: 排除非普通股
- **WHEN** 系統建立熱力圖資料
- **THEN** 系統 MUST NOT 將 ETF、基金或其他非普通股類型納入 `stocks` 陣列

#### Scenario: 指定日期無資料
- **WHEN** 指定日期及之前均無任何 TSE 個股 Ticker 資料
- **THEN** 系統 SHALL 回傳 HTTP 200，`sectors` 為空陣列

### Requirement: 個股靜態資訊儲存
系統 SHALL 維護一份 `Equity` collection，儲存每支個股的產業分類代碼（`industryCode`）與最近一次已知的發行股數（`issuedShares`），供市值計算使用。

系統 SHALL 在每個交易日以 `stocks.list()` 與 `stocks.finiHoldings()` 更新 TSE 普通股的 `Equity` collection。
若 `finiHoldings` 當日無資料（假日），系統 SHALL 保留 collection 中現有的 `issuedShares` 值（不覆蓋為空）。

#### Scenario: 每日更新股票靜態資訊
- **WHEN** `updateTwseStockInfo` cron job 執行
- **THEN** 系統 SHALL 以 `stocks.list()` 取得 TSE 普通股清單及其 `industryCode`
- **AND** 系統 SHALL 以 `stocks.finiHoldings()` 取得有資料的個股 `issuedShares`，並 upsert 至 `StockInfo`

#### Scenario: finiHoldings 假日無資料時保留舊值
- **WHEN** `stocks.finiHoldings()` 回傳 null（假日或非交易日）
- **THEN** 系統 SHALL 僅更新 `industryCode`，MUST NOT 覆蓋現有 `issuedShares`

#### Scenario: 市值計算
- **WHEN** 系統建立市場熱力圖資料
- **THEN** 每支個股的 `marketCap` SHALL 計算為 `issuedShares × closePrice`
- **AND** 若該個股無 `issuedShares` 資料，系統 SHALL 使用 `tradeValue` 作為 fallback 大小值

### Requirement: 首頁市場熱力圖區塊
首頁 SHALL 在三張市場快照卡片下方顯示市場熱力圖區塊，使用 ECharts treemap 呈現當日 TSE 全市場股票的漲跌分佈。

#### Scenario: 顯示熱力圖
- **WHEN** 首頁載入選取日期
- **THEN** 系統 SHALL 在快照卡片下方顯示熱力圖，以產業為父矩形、個股為子矩形
- **AND** 矩形大小 SHALL 依個股市值（或 fallback 至 tradeValue）決定
- **AND** 矩形顏色 SHALL 依個股 `changePercent` 使用紅漲綠跌色階（台灣慣例）

#### Scenario: Hover tooltip 顯示 OHLCV
- **WHEN** 使用者將滑鼠懸停在某個股矩形上
- **THEN** 系統 SHALL 顯示 tooltip，包含股票名稱、代號、漲跌幅、開盤、最高、最低、收盤、成交量

#### Scenario: 熱力圖顯示 loading 狀態
- **WHEN** 市場熱力圖資料載入中
- **THEN** 系統 SHALL 在熱力圖區塊顯示 loading 指示器

#### Scenario: 熱力圖無資料
- **WHEN** 選取日期無熱力圖資料
- **THEN** 系統 SHALL 在熱力圖區塊顯示中性的缺資料說明，MUST NOT 顯示空白區塊
