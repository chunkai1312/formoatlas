## 1. 後端 — Equity Collection

- [x] 1.1 新增 `Equity` schema（`symbol`、`exchange`、`industryCode`、`issuedShares`），以 `{ symbol, exchange }` 建立 unique index
- [x] 1.2 新增 `EquityRepository`，提供 `upsertEquity()`、`findAllByExchange()` 方法
- [x] 1.3 建立 `industryCode → 中文名稱` 靜態對照表 util（對應 TWSE 官方類股分類）
- [x] 1.4 在 `TickerService` 新增 `updateTwseEquityProfiles()` cron method（`@Cron('0 0 17 * * *')`），呼叫 `stocks.list({ exchange: 'TWSE' })` 取得 TSE 普通股 industryCode，再呼叫 `stocks.finiHoldings()` upsert issuedShares（假日時僅更新 industryCode）
- [x] 1.5 在 `updateTwseEquityProfiles()` 中以 `type === '股票'` 過濾普通股（`stocks.list()` 回傳的中文 type 值已確認，其餘類型為 ETF/ETN/權證/特別股/TDR）
- [x] 1.6 在 `MarketdataModule` 中註冊 `Equity` model 與 `EquityRepository`
- [x] 1.7 新增 `updateTpexEquityProfiles()` cron method（`@Cron('0 5 17 * * *')`），同邏輯但針對 TPEx exchange，排在 TWSE cron 之後避免並發

## 2. 後端 — Market Map Endpoint

- [x] 2.1 新增 `MarketMapItem` type（`symbol`、`name`、`marketCap`、`changePercent`、`openPrice`、`highPrice`、`lowPrice`、`closePrice`、`tradeVolume`）
- [x] 2.2 新增 `MarketMapSector` type（`industryCode`、`name`、`totalMarketCap`、`stocks`）
- [x] 2.3 新增 `MarketMapResponse` type（`date`、`market`、`sectors`）
- [x] 2.4 在 `TickerRepository` 新增 `getMarketMap(options)` 方法：查詢指定日期最近一個有效交易日的 Equity Tickers，與 `Equity` collection join，計算 `marketCap = issuedShares × closePrice`（fallback 為 `tradeValue`），以 `industryCode` 分組回傳階層結構
- [x] 2.5 在 `MarketdataController` 新增 `GET /marketdata/market-map` endpoint，接受 `date`（選填）、`market`（選填，`TSE` / `OTC`，預設 TSE）query params

## 3. 前端 — 資料模型與 Service

- [x] 3.1 新增 `apps/web/src/app/core/models/market-map.model.ts`，定義 `MarketMapItem`、`MarketMapSector`、`MarketMapResponse` interface
- [x] 3.2 在 `TickerService`（前端）新增 `getMarketMap(date: string, market?: 'TSE' | 'OTC')` 方法，呼叫 `GET /marketdata/market-map`

## 4. 前端 — MarketMapComponent

- [x] 4.1 建立 `apps/web/src/app/features/home/market-map/market-map.component.ts`（standalone），import `NgxEchartsModule`
- [x] 4.2 實作 ECharts treemap option：外層為產業矩形（含產業名稱 upperLabel），內層為個股矩形（含股名 label）
- [x] 4.3 設定矩形大小 = `value[0]`（marketCap 或 fallback tradeValue）；`value` 為陣列形式 `[marketCap, changePercent]`，ECharts treemap 以第 0 位決定面積
- [x] 4.4 設定顏色視覺映射（`visualMap`）：`dimension: 1` 連結 `changePercent`，範圍 `-10 ~ +10`，深色模式色階為點亮山綠→深灰→鮮紅，淺色模式為中綠→近白→珊瑚紅；`computed` 讀取 `isDark()` 自動切換
- [x] 4.5 設定 hover tooltip，顯示：股票名稱、代號；開高低收各依參考價（昨收）標色（高於昨收→紅、低於→綠、相等→預設）；漲跌金額與漲跌幅；成交量（張）。Tooltip 背景深色/淺色模式各異
- [x] 4.6 實作 loading 狀態
- [x] 4.7 實作空資料狀態（中性提示文字）
- [x] 4.8 建立 `market-map.component.scss`，設定 `height: 680px`，全寬顯示
- [x] 4.9 個股標籤顏色依主題動態切換（深色 `#fff`，淺色 `#111827`），使用 rich text 語法確保覆蓋 ECharts 預設值；不傳 `[theme]` 屬性，避免 ECharts 主題注入覆蓋自定義 label 顏色
- [x] 4.10 `visualMap.calculable: false` 禁止使用者拖拉調整色階範圍

## 5. 前端 — 整合首頁

- [x] 5.1 在 `HomeComponent` 注入 `TickerService`，新增 `marketMap`、`marketMapOtc` signal 與 `marketMapMarket` signal（`'TSE' | 'OTC'`），以及對應的 loading/error signal
- [x] 5.2 在 `toObservable(selectedDate)` 的訂閱中分別為 TSE / OTC 呼叫 `getMarketMap()`
- [x] 5.3 在 `home.component.html` 三張快照卡片下方加入 `<section class="market-map-section">`，含「上市」/「上櫃」tab 按鈕，依 `marketMapMarket()` 條件渲染對應的 `<app-market-map>`
- [x] 5.4 調整 `home.component.scss`，熱力圖標題列與 tab 按鈕同行排列，tab 含 `.active` 高亮樣式
