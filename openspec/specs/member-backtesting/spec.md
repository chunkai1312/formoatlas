## ADDED 需求

### 需求：會員限定回測端點
API SHALL 提供由 `JwtAuthGuard` 保護的 `POST /api/backtesting/run` 端點。

未驗證的請求 SHALL 以 HTTP 401 拒絕。

端點 SHALL 接受包含以下欄位的 `RunBacktestDto`：
- `symbol`：string（必填）
- `strategy`：`'buy-and-hold' | 'sma-cross'`（必填）
- `startDate`：ISO 日期字串（選填）
- `endDate`：ISO 日期字串（選填）
- `initialCash`：number（必填）
- `feeRate`：number（選填）
- `taxRate`：number（選填）
- `tradeOnClose`：boolean（選填）
- `params.shortWindow`：number（`sma-cross` 時必填）
- `params.longWindow`：number（`sma-cross` 時必填）
- `params.orderSize`：number（選填；`buy-and-hold` 預設為全額買入）

#### 情境：未驗證請求被拒絕
- **當** 請求至 `POST /api/backtesting/run` 未攜帶有效 JWT cookie
- **則** API 回傳 HTTP 401
- **且** 不執行任何回測邏輯

#### 情境：無效 DTO 被拒絕
- **當** 已驗證請求缺少 `symbol`、`strategy` 或 `initialCash`
- **則** API 回傳 HTTP 400 並附上驗證錯誤詳細說明

#### 情境：sma-cross 缺少參數
- **當** 已驗證請求指定 `strategy: sma-cross` 但未提供 `shortWindow` 或 `longWindow`
- **則** API 回傳 HTTP 400

### 需求：OHLC 資料轉接器
`BacktestingService` SHALL 透過 `TickerRepository.getOhlcBySymbol()` 取得 OHLC 資料，並轉換為 `node-backtesting` 所需格式。

若解析後的 OHLC 序列資料點數少於 `longWindow`，服務 SHALL 回傳 HTTP 400 並說明資料不足。

若請求的日期區間取不到任何 OHLC 資料，服務 SHALL 回傳 HTTP 400。

#### 情境：資料充足
- **當** 解析後 OHLC 序列長度 >= `longWindow`（sma-cross）或 >= 2（buy-and-hold）
- **則** 回測正常執行

#### 情境：sma-cross 資料不足
- **當** 解析後 OHLC 序列長度 < `longWindow`
- **則** API 回傳 HTTP 400 並帶有錯誤碼 `INSUFFICIENT_DATA`

#### 情境：日期區間無資料
- **當** `startDate`／`endDate` 對應的 OHLC 序列為空
- **則** API 回傳 HTTP 400 並帶有錯誤碼 `NO_DATA_IN_RANGE`

### 需求：買進持有策略
`BacktestingService` SHALL 支援 `buy-and-hold` 策略轉接器。

若未指定 `params.orderSize`，轉接器 SHALL 以 `initialCash` 在第一個可用收盤價買入最多整股數量。

若指定 `params.orderSize`，轉接器 SHALL 買入恰好該數量的股數。

策略 SHALL 持倉至整個日期區間結束，並於最後收盤時出場。

#### 情境：不指定 orderSize 的買進持有
- **當** 策略為 `buy-and-hold` 且未提供 `params.orderSize`
- **則** 轉接器以 `initialCash` 在第一個收盤價買入最多整股數
- **且** 持倉至日期區間結束

#### 情境：指定 orderSize 的買進持有
- **當** 策略為 `buy-and-hold` 且已設定 `params.orderSize`
- **則** 轉接器在第一個收盤價買入恰好 `orderSize` 股

### 需求：SMA 交叉策略
`BacktestingService` SHALL 支援使用 `shortWindow` 與 `longWindow` 的 `sma-cross` 策略轉接器。

當短期 SMA 向上穿越長期 SMA 時，轉接器 SHALL 產生買入訊號；向下穿越時產生賣出訊號。

每筆買入委託 SHALL 使用 `params.orderSize` 股數。

SMA 交叉回應 SHALL 包含 `benchmark` 欄位，內容為相同標的、相同期間及相同 `initialCash` 的買進持有結果。

#### 情境：SMA 交叉訊號
- **當** 短期 SMA 向上穿越長期 SMA
- **則** 轉接器以 `orderSize` 股開多單

- **當** 短期 SMA 向下穿越長期 SMA
- **則** 轉接器平倉所有多單

#### 情境：SMA 交叉基準比較
- **當** 策略為 `sma-cross` 且回測完成
- **則** 回應包含 `benchmark`，內含買進持有的績效指標、資產曲線、回撤曲線與交易紀錄

### 需求：回測回應合約
API SHALL 回傳符合 `BacktestResult` 結構的回應，不暴露 `node-backtesting` 內部細節。

回應 SHALL 包含：
- `symbol`、`strategy`、`requestedRange`、`resolvedRange`、`params`
- `metrics`：`finalEquity`、`totalReturnPct`、`annualizedReturnPct`、`maxDrawdownPct`、`winRatePct`、`tradeCount`、`buyHoldReturnPct`
- `equityCurve`：`{ date, equity }` 陣列
- `drawdownCurve`：`{ date, drawdownPct }` 陣列
- `trades`：`{ entryDate, exitDate, entryPrice, exitPrice, size, pnl, returnPct }` 陣列
- `benchmark`（僅 sma-cross）：巢狀的 `BacktestResult` 結構物件
- `warnings`：字串陣列

#### 情境：警告訊息永遠存在
- **當** 回測成功完成
- **則** `warnings` 至少包含一則說明結果為歷史模擬且不構成投資建議的訊息

#### 情境：交易成本揭露
- **當** 回測完成
- **則** `warnings` 包含實際使用的 `feeRate` 與 `taxRate`

### 需求：個股頁回測面板
個股詳情頁 SHALL 包含回測面板。

使用者未登入時，面板 SHALL 顯示現有的登入提示，且 SHALL NOT 顯示策略控制項。

使用者已登入時，面板 SHALL 顯示以下控制項：
- 初始資金
- 日期區間（開始／結束）
- 策略選擇器（`buy-and-hold` | `sma-cross`），預設為 `buy-and-hold`
- 短期 SMA 視窗、長期 SMA 視窗及委託股數（僅在選擇 `sma-cross` 時顯示）
- 手續費率與交易稅率

面板 SHALL 顯示執行回測的提交按鈕。

#### 情境：未登入的回測面板
- **當** 使用者未登入並造訪個股詳情頁
- **則** 回測面板顯示登入提示
- **且** 策略控制項不渲染

#### 情境：預設策略為買進持有
- **當** 已登入使用者開啟回測面板
- **則** 策略選擇器預設為 `buy-and-hold`
- **且** SMA 參數輸入框隱藏

#### 情境：選擇 SMA 交叉後顯示對應控制項
- **當** 已登入使用者選擇 `sma-cross` 策略
- **則** 短期視窗、長期視窗及委託股數輸入框顯示

### 需求：回測結果顯示
回測成功後，面板 SHALL 顯示：
- 績效摘要：最終資產、總報酬率、年化報酬率、最大回撤、勝率、交易次數
- 資產曲線圖
- 回撤曲線圖
- 交易紀錄表（含進出場日期、價格、股數、損益、報酬率）
- 回應中的所有 `warnings`

`sma-cross` 結果時，面板 SHALL 額外並排顯示買進持有基準的績效指標。

#### 情境：渲染買進持有結果
- **當** 回測回傳策略 `buy-and-hold`
- **則** 面板渲染績效指標、資產曲線、回撤曲線、交易紀錄及警告訊息
- **且** 不顯示基準比較區塊

#### 情境：渲染含基準比較的 sma-cross 結果
- **當** 回測回傳策略 `sma-cross`
- **則** 面板並排渲染主要策略與買進持有基準的績效指標
- **且** 兩者的資產曲線與回撤曲線均顯示

#### 情境：渲染錯誤狀態
- **當** 回測 API 回傳錯誤（4xx）
- **則** 面板顯示錯誤訊息，不渲染結果

### 需求：風險揭露
所有回測 UI 與 API 回應 SHALL 明顯標示以下揭露聲明：
「歷史回測為情境模擬，不構成投資建議，不保證未來績效。」

#### 情境：API 回應中的揭露聲明
- **當** 回測完成
- **則** `warnings` 陣列包含風險揭露字串

#### 情境：UI 中的揭露聲明
- **當** 回測結果顯示
- **則** 警告區塊渲染回應中的所有警告字串
