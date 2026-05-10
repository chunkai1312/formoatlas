## MODIFIED Requirements

### Requirement: OHLC 資料轉接器
`BacktestingService` SHALL 透過 `TickerRepository.getOhlcBySymbol()` 或等效的 market data OHLC adapter 取得還原 OHLC 資料，並轉換為 `node-backtesting` 所需格式。

回測 SHALL 一律使用還原 OHLC，不提供 request-level 原始 / 還原切換。

若解析後的 OHLC 序列資料點數少於 `longWindow`，服務 SHALL 回傳 HTTP 400 並說明資料不足。

若請求的日期區間取不到任何 OHLC 資料，服務 SHALL 回傳 HTTP 400。

#### 情境：資料充足
- **WHEN** 解析後 OHLC 序列長度 >= `longWindow`（sma-cross）或 >= 2（buy-and-hold）
- **THEN** 回測正常執行
- **AND** 策略輸入資料使用還原 OHLC

#### 情境：sma-cross 資料不足
- **WHEN** 解析後 OHLC 序列長度 < `longWindow`
- **THEN** API 回傳 HTTP 400 並帶有錯誤碼 `INSUFFICIENT_DATA`

#### 情境：日期區間無資料
- **WHEN** `startDate`／`endDate` 對應的 OHLC 序列為空
- **THEN** API 回傳 HTTP 400 並帶有錯誤碼 `NO_DATA_IN_RANGE`

### Requirement: 回測回應合約
API SHALL 回傳符合 `BacktestResult` 結構的回應，不暴露 `node-backtesting` 內部細節。

回應 SHALL 包含：
- `symbol`、`strategy`、`requestedRange`、`resolvedRange`、`params`
- `metrics`：`finalEquity`、`totalReturnPct`、`annualizedReturnPct`、`maxDrawdownPct`、`winRatePct`、`tradeCount`、`buyHoldReturnPct`
- `equityCurve`：`{ date, equity }` 陣列
- `drawdownCurve`：`{ date, drawdownPct }` 陣列
- `trades`：`{ entryDate, exitDate, entryPrice, exitPrice, size, pnl, returnPct }` 陣列
- `benchmark`（僅 sma-cross）：巢狀的 `BacktestResult` 結構物件
- `warnings`：字串陣列

回應 warnings SHALL 揭露回測使用還原股價。

#### 情境：警告訊息永遠存在
- **WHEN** 回測成功完成
- **THEN** `warnings` 至少包含一則說明結果為歷史模擬且不構成投資建議的訊息

#### 情境：交易成本揭露
- **WHEN** 回測完成
- **THEN** `warnings` 包含實際使用的 `feeRate` 與 `taxRate`

#### 情境：還原股價揭露
- **WHEN** 回測完成
- **THEN** `warnings` 包含回測使用還原股價的訊息
