## Why

FormoAtlas 現有 K 線與回測都使用原始 OHLC，遇到除權息、減資、股票面額變更或 ETF 分割/反分割時，歷史價格會出現非市場交易造成的跳空。這會讓長期 K 線、均線與回測績效產生誤讀，因此需要建立可追溯的還原價格資料管線。

## What Changes

- 新增 `PriceAdjustmentEvent` 資料能力，從 `node-twstock` 同步除權息、減資、股票面額變更、ETF 分割與 ETF 反分割資料。
- 將各事件標準化為中性的價格調整事件，保存 normalized fields、預先計算的 `factor` 與來源 `raw` 資料。
- `GET /marketdata/tickers` 新增 `adjusted=true` query parameter；未帶或為 false 時維持原始 OHLC，為 true 時回傳向後還原 OHLC。
- 還原價第一版只調整 `openPrice`、`highPrice`、`lowPrice`、`closePrice`，不調整成交量或成交金額。
- 同一 effective date 的多筆事件分別保存，計算還原價格時將 factor 相乘。
- 回測一律使用還原 OHLC，並在 warnings 中揭露回測使用還原股價。
- 個股頁 K 線提供「原始 / 還原」切換；Dashboard 大盤指數 K 線不套用還原價，即使帶 `adjusted=true` 也回傳原始資料。
- 初始化時同步近 10 年調整事件，之後每日增量更新。

## Capabilities

### New Capabilities

- `price-adjustment-events`: 管理會改變價格連續性的事件，包含資料同步、normalized event storage、factor 保存與查詢。

### Modified Capabilities

- `ticker-ohlc-api`: OHLC 查詢端點支援 `adjusted=true`，回傳還原後的 OHLC。
- `member-backtesting`: 會員回測資料來源改為還原 OHLC，並揭露使用還原股價。
- `stock-detail-page`: 個股頁 K 線提供原始 / 還原價格切換。

## Impact

- **後端**：新增 `PriceAdjustmentEvent` schema、repository、service 與調整價格計算 service；擴充 `TickerRepository.getOhlcBySymbol()` 或相關 market data service 以支援 adjusted 查詢。
- **API**：`GET /marketdata/tickers` 新增 optional `adjusted` query parameter；既有呼叫不受影響。
- **排程 / 初始化**：新增近 10 年初始化同步與每日增量同步流程，資料來源為 `node-twstock` 的 `stocks.dividends()`、`stocks.capitalReductions()`、`stocks.splits()`、`stocks.etfSplits()`。
- **前端**：個股頁 K 線增加原始 / 還原切換；core ticker model/service 支援 adjusted 參數。
- **回測**：`BacktestingService` 改用還原 OHLC；結果 warnings 額外標示還原價格假設。
- **資料庫**：新增價格調整事件 collection 與查詢索引，不改寫既有 `Ticker` 原始行情。
