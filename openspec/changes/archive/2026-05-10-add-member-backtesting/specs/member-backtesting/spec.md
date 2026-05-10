## ADDED Requirements

### Requirement: 會員限定執行回測
系統 SHALL 提供會員限定的股票回測執行 API。

此 API SHALL 要求有效的會員登入 session，並拒絕未登入請求。

第一版回測結果 SHALL 即時計算並回傳，且 SHALL NOT 持久化保存。

#### Scenario: 已登入會員執行回測
- **WHEN** 已登入會員以有效的單股回測 request 呼叫 `POST /api/backtesting/run`
- **THEN** 系統 SHALL 使用歷史 OHLC 資料執行回測
- **AND** 回傳回測結果 response

#### Scenario: 未登入使用者嘗試執行回測
- **WHEN** 沒有有效 JWT session 的 request 呼叫 `POST /api/backtesting/run`
- **THEN** 系統 SHALL 回傳 HTTP 401
- **AND** SHALL NOT 執行回測

#### Scenario: 回測結果不保存
- **WHEN** 會員成功執行回測
- **THEN** 系統 SHALL 在 HTTP response 中回傳結果
- **AND** SHALL NOT 建立持久化的 backtest run record

### Requirement: 買進持有單股回測
系統 SHALL 支援單一股票代號的 buy-and-hold 策略。

策略 SHALL 在期初建立一筆長部位，並持有到回測期末。

若 request 未指定 `orderSize`，策略 SHALL 以初始資金盡量買滿；若 request 指定 `orderSize`，策略 SHALL 使用該股數建立部位。

#### Scenario: 未指定股數執行買進持有
- **WHEN** request 指定 `strategy: buy-and-hold`、`initialCash` 與有效股票代號，但未指定 `orderSize`
- **THEN** 系統 SHALL 以初始資金盡量買滿該股票
- **AND** 持有至回測期末

#### Scenario: 指定股數執行買進持有
- **WHEN** request 指定 `strategy: buy-and-hold`、`orderSize`、`initialCash` 與有效股票代號
- **THEN** 系統 SHALL 使用 `orderSize` 作為期初買進股數
- **AND** 持有至回測期末

### Requirement: SMA cross 單股回測
系統 SHALL 支援單一股票代號的 SMA cross 策略。

策略 SHALL 使用可設定的短期均線與長期均線週期。

策略 SHALL 在短期 SMA 向上穿越長期 SMA 時買進，並在短期 SMA 向下穿越長期 SMA 時賣出。

策略 SHALL 以股數交易，第一版 SHALL NOT 強制整張交易限制。

SMA cross 回測 response SHALL include buy-and-hold benchmark results for the same symbol, capital, costs, and date range.

#### Scenario: 使用有效參數執行 SMA cross
- **WHEN** request 指定 `strategy: sma-cross`、`shortWindow`、`longWindow`、`orderSize`、`initialCash` 與有效股票代號
- **THEN** 系統 SHALL 在 resolved OHLC range 上執行 SMA cross 策略
- **AND** 使用 `orderSize` 作為每次交易要求的股數
- **AND** response SHALL include `benchmark.strategy: buy-and-hold`

#### Scenario: SMA 週期關係無效
- **WHEN** `shortWindow` 大於或等於 `longWindow`
- **THEN** 系統 SHALL 以 HTTP 400 拒絕 request

#### Scenario: OHLC 資料不足
- **WHEN** resolved OHLC series 筆數少於 request 的 `longWindow`
- **THEN** 系統 SHALL 以 HTTP 400 拒絕 request
- **AND** 說明歷史資料不足以執行該策略參數

### Requirement: 回測結果指標
系統 SHALL 回傳適合 API client 與圖表呈現的標準化回測指標。

Response SHALL 包含策略參數、resolved date range、績效指標、權益曲線、回撤曲線、交易清單與 warnings。

Response SHALL 包含「歷史回測為模擬、不構成投資建議」的 warning。

#### Scenario: 成功回測回傳指標
- **WHEN** 回測成功完成
- **THEN** response SHALL 包含 `finalEquity`、`totalReturnPct`、`annualizedReturnPct`、`maxDrawdownPct`、`winRatePct`、`tradeCount` 與 `buyHoldReturnPct`
- **AND** 包含 `equityCurve`、`drawdownCurve` 與 `trades`

#### Scenario: SMA response 包含買進持有 benchmark
- **WHEN** `sma-cross` 回測成功完成
- **THEN** response SHALL include `benchmark`
- **AND** `benchmark` SHALL include metrics、equity curve、drawdown curve 與 trades

#### Scenario: 買進持有 response 不重複 benchmark
- **WHEN** `buy-and-hold` 回測成功完成
- **THEN** response SHALL NOT include a duplicate `benchmark`

#### Scenario: Response 包含假設與 warnings
- **WHEN** 回測 response 被回傳
- **THEN** response SHALL 包含描述歷史模擬限制的 warnings
- **AND** 包含該次回測使用的交易成本與成交假設

### Requirement: 個股頁回測面板
web app SHALL 在個股頁提供回測面板。

此面板 SHALL 對未登入使用者顯示 auth gate，並 SHALL 允許已登入使用者為目前股票設定並執行 buy-and-hold 或 SMA cross 回測。

此面板 SHALL 預設選取 buy-and-hold 策略。

#### Scenario: 未登入使用者看到登入 gate
- **WHEN** 未登入使用者瀏覽個股頁
- **THEN** 回測面板 SHALL 顯示需要登入的狀態
- **AND** SHALL NOT 暴露執行回測 action

#### Scenario: 回測面板預設策略
- **WHEN** 已登入使用者首次看到個股頁回測面板
- **THEN** web app SHALL 預設選取買進持有策略
- **AND** SHALL NOT 顯示 SMA 專用的短均線與長均線欄位

#### Scenario: 已登入使用者從個股頁執行 SMA cross 回測
- **WHEN** 已登入使用者在 `/stocks/2330` 選擇 SMA cross、設定參數並提交表單
- **THEN** web app SHALL 以 symbol `2330` 呼叫會員限定回測 API
- **AND** 呈現回傳的指標、圖表與交易明細

#### Scenario: 已登入使用者從個股頁執行買進持有回測
- **WHEN** 已登入使用者在 `/stocks/2330` 選擇買進持有並提交表單
- **THEN** web app SHALL 以 `strategy: buy-and-hold` 呼叫會員限定回測 API
- **AND** 若未指定股數，request SHALL NOT include `orderSize`

#### Scenario: 面板顯示 API 錯誤
- **WHEN** 回測 API 回傳 validation 或資料可用性錯誤
- **THEN** 面板 SHALL 顯示穩定的錯誤狀態
- **AND** 保留使用者目前的表單參數
