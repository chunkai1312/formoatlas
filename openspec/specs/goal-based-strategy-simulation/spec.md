## Requirements

### Requirement: 目標導向模擬請求模型
系統 SHALL 定義 `GoalSimulationRequest` 模型，供目標導向買進持有模擬功能使用。

請求模型 SHALL 包含以下欄位：
- `targetAmount`：number（選填）— 期望的最終投資組合價值
- `targetAnnualReturnPct`：number（選填）— 期望的 money-weighted 年化報酬率
- `horizonYears`：number（必填）— 投資年限
- `startDate`：string（選填，YYYY-MM-DD）— 歷史模擬開始日期
- `endDate`：string（選填，YYYY-MM-DD）— 歷史模擬結束日期
- `initialCapital`：number（必填）— 初始本金
- `monthlyContribution`：number（必填）— 每月定期投入金額（純單筆投入時填 0）
- `universe.type`：第一版 SHALL 支援 `'single-symbol'`
- `universe.symbols`：string[]（當 type 為 `single-symbol` 時必填且只能包含一個 symbol）

`targetAmount` 與 `targetAnnualReturnPct` 至少需提供其中一個。

第一版 SHALL 固定使用 `buy-and-hold` 策略；request SHALL NOT 要求使用者提供候選策略、SMA 參數或配置比例。

若只提供 `targetAnnualReturnPct`，系統 SHALL 使用與模擬相同的現金流排程反推 `targetAmount`。

若未提供 `endDate`，系統 SHALL 以今日作為 requested end date。

若未提供 `startDate`，系統 SHALL 以 requested end date 往前 `horizonYears` 作為 requested start date。

若同時提供 `startDate` 與 `endDate`，系統 SHALL 使用該日期區間取得歷史 OHLC。

#### Scenario: 有效的買進持有目標模擬請求
- **WHEN** 請求提供 `horizonYears`、`initialCapital`、`monthlyContribution`、至少一個目標欄位與 `single-symbol` universe
- **THEN** 系統接受該請求為有效
- **AND** 系統 SHALL 使用 `buy-and-hold` 執行模擬

#### Scenario: 有效的自訂日期區間請求
- **WHEN** 請求提供有效 `startDate` 與 `endDate`
- **THEN** 系統 SHALL 使用該日期區間作為 `requestedRange`

#### Scenario: 未提供日期區間
- **WHEN** 請求省略 `startDate` 與 `endDate`
- **THEN** 系統 SHALL 使用今日作為 `endDate`
- **AND** SHALL 使用 `endDate - horizonYears` 作為 `startDate`

#### Scenario: 日期區間無效
- **WHEN** 請求提供的 `startDate` 晚於 `endDate`
- **THEN** 系統以驗證錯誤拒絕請求

#### Scenario: 兩個目標欄位皆缺失
- **WHEN** 請求同時省略 `targetAmount` 與 `targetAnnualReturnPct`
- **THEN** 系統以驗證錯誤拒絕請求

#### Scenario: 單一標的 universe 未提供 symbols
- **WHEN** `universe.type` 為 `single-symbol`，但 `universe.symbols` 為空或未提供
- **THEN** 系統以驗證錯誤拒絕請求

#### Scenario: 第一版不支援的 universe
- **WHEN** request 使用 `watchlist`、`market` 或 `allocation` universe
- **THEN** 系統以驗證錯誤拒絕請求

#### Scenario: 目標年化反推使用相同現金流排程
- **WHEN** 請求只提供 `targetAnnualReturnPct`
- **THEN** 系統 SHALL 使用 resolved trading dates 與每月第一個可用交易日投入排程反推 `targetAmount`

### Requirement: 目標導向模擬回應模型
系統 SHALL 定義 `GoalSimulationResult` 模型，描述目標導向買進持有模擬執行的輸出結果。

回應 SHALL 包含：
- `universe`：解析後使用的 universe
- `requestedHorizonYears`
- `requestedRange`
- `resolvedRange`
- `target`
- `cashflow`
- `costAssumption`
- `candidates`
- `warnings`

`candidates` SHALL 只包含一筆買進持有結果，其內容包含：
- `strategy`：固定為 `buy-and-hold`
- `label`：策略顯示名稱
- `status`：固定為 `available`
- `goalAttainmentRate`：number — 期末權益總值相對目標金額的達成比例百分比
- `projectedFinalValue`：number
- `targetGap`：number
- `metrics`：`totalReturnPct`、`annualizedReturnPct`、`maxDrawdownPct`、`worstPeriod`
- `equityCurve`：`{ date: string; value: number }[]`
- `drawdownCurve`：`{ date: string; drawdownPct: number }[]`
- `tradeRecords`：`{ date: string; action: 'buy'; reason: 'initial-capital' | 'monthly-contribution'; price: number; shares: number; amount: number; cashAfter: number }[]`
- `suggestions`：字串陣列
- `warnings`：字串陣列

`annualizedReturnPct` SHALL 代表 money-weighted return（XIRR）。若 XIRR 無法收斂，`annualizedReturnPct` SHALL 為 null，且 candidate warnings SHALL 說明原因。

回應頂層 warnings SHALL 揭露歷史情境模擬限制、不構成投資建議、不保證未來績效、價格調整假設與交易成本假設。

#### Scenario: 回傳單一買進持有結果
- **WHEN** 模擬完成
- **THEN** `candidates` SHALL 只包含一筆結果
- **AND** 該結果的 `strategy` SHALL 為 `buy-and-hold`
- **AND** 該結果的 `status` SHALL 為 `available`

#### Scenario: 目標達成
- **WHEN** 買進持有結果在歷史情境中達成目標
- **THEN** `goalAttainmentRate` 大於或等於 100
- **AND** `targetGap` 大於或等於 0

#### Scenario: 目標未達成
- **WHEN** 買進持有結果在歷史情境中未達成目標
- **THEN** `goalAttainmentRate` SHALL 等於 `projectedFinalValue / target.targetAmount * 100`
- **AND** `goalAttainmentRate` 小於 100
- **AND** `suggestions` 包含建議，引導使用者提高投入金額、延長年限或降低目標金額

#### Scenario: 回傳資產曲線與回撤曲線
- **WHEN** 買進持有模擬完成
- **THEN** candidate SHALL 包含 `equityCurve`
- **AND** candidate SHALL 包含 `drawdownCurve`
- **AND** 兩條曲線 SHALL 使用同一組交易日期

#### Scenario: 回傳交易紀錄
- **WHEN** 買進持有模擬完成且期初或每月投入實際買進股票
- **THEN** candidate SHALL 包含 `tradeRecords`
- **AND** 每筆交易 SHALL 包含日期、買進動作、交易來源、成交價、股數、成交金額與交易後現金
- **AND** `tradeRecords` SHALL NOT 包含未成交的投入事件

#### Scenario: XIRR 無法收斂
- **WHEN** 可用 candidate 的 money-weighted return 無法計算或無法收斂
- **THEN** `metrics.annualizedReturnPct` SHALL 為 null
- **AND** candidate warnings SHALL 說明年化報酬無法計算

#### Scenario: 回應中包含必要風險揭露
- **WHEN** 模擬完成
- **THEN** `warnings` SHALL 揭露歷史情境模擬
- **AND** `warnings` SHALL 揭露不構成投資建議
- **AND** `warnings` SHALL 揭露不保證未來績效

### Requirement: 目標導向模擬 API
系統 SHALL 提供公開可呼叫的 `POST /api/goal-simulation/run` API。

此 API SHALL NOT 使用 `JwtAuthGuard` 保護。

此 API SHALL NOT 保存模擬結果。

#### Scenario: 使用者執行目標模擬
- **WHEN** 任一使用者呼叫 `POST /api/goal-simulation/run` 並提供有效 request
- **THEN** 系統 SHALL 回傳 `GoalSimulationResult`

#### Scenario: 未登入使用者執行目標模擬
- **WHEN** 未登入 request 呼叫 `POST /api/goal-simulation/run` 並提供有效 request
- **THEN** 系統 SHALL 執行模擬
- **AND** 系統 SHALL 回傳 `GoalSimulationResult`

#### Scenario: 無效目標模擬 request
- **WHEN** 任一使用者呼叫 `POST /api/goal-simulation/run` 並提供無效 request
- **THEN** 系統 SHALL 回傳 HTTP 400
- **AND** SHALL NOT 保存任何模擬設定或結果

### Requirement: 目標導向模擬 UI
web app SHALL 提供公開可用的目標導向買進持有模擬頁面，讓使用者設定目標、投資條件、歷史模擬日期區間與單一股票代號。

股票代號欄位預設值 SHALL 為 `0050`。

頁面 SHALL 支援 URL query params 帶入表單初始設定，包含 `symbol`、`targetMode`、`targetAmount`、`targetAnnualReturnPct`、`horizonYears`、`startDate`、`endDate`、`initialCapital` 與 `monthlyContribution`。

URL query params SHALL 只初始化表單，SHALL NOT 自動提交模擬。

未登入使用者 SHALL 可看到目標模擬表單與提交 action。

頁面 SHALL NOT 要求使用者登入才可提交目標模擬。

頁面 SHALL NOT 顯示策略選擇、SMA 參數或股票配置百分比。

頁面 SHALL 顯示買進持有結果、權益總值、目標缺口、主要風險指標、requested/resolved range、成本假設摘要、資產曲線、回撤曲線與交易紀錄。

權益總值 SHALL 顯示在下方並排數據結果中，SHALL NOT 顯示在 candidate 卡片右上角。

頁面 SHALL NOT 顯示 suggestions、candidate warnings、頂層 warnings 或成本假設描述的純文字段落。

#### Scenario: 使用者提交買進持有目標模擬
- **WHEN** 使用者填寫目標金額或目標年化、年限、日期區間、初始本金、每月投入與單一股票代號後提交
- **THEN** web app SHALL 呼叫 `POST /api/goal-simulation/run`
- **AND** request SHALL NOT 包含策略選擇、SMA 參數或股票配置百分比
- **AND** 顯示買進持有模擬結果

#### Scenario: 未登入使用者提交買進持有目標模擬
- **WHEN** 未登入使用者填寫有效表單後提交目標模擬
- **THEN** web app SHALL 呼叫 `POST /api/goal-simulation/run`
- **AND** SHALL NOT 顯示登入提示作為提交前置條件
- **AND** 顯示買進持有模擬結果

#### Scenario: 使用預設股票代號
- **WHEN** 使用者開啟目標模擬頁且 URL 未提供 `symbol`
- **THEN** 股票代號欄位 SHALL 顯示 `0050`

#### Scenario: URL query params 初始化表單
- **WHEN** 使用者開啟 `/goal-simulation` 且 URL query params 包含表單設定
- **THEN** web app SHALL 以有效 query params 覆蓋表單初始值
- **AND** web app SHALL NOT 自動提交模擬

#### Scenario: URL query params 提交
- **WHEN** URL query params 已初始化表單且使用者提交模擬
- **THEN** web app SHALL 使用 query params 帶入的表單值組成 request

#### Scenario: 使用者指定日期區間
- **WHEN** 使用者填寫開始日期與結束日期後提交
- **THEN** web app SHALL 在 request 中送出 `startDate` 與 `endDate`
- **AND** 結果 SHALL 顯示 requested/resolved range

#### Scenario: 顯示資產與回撤圖表
- **WHEN** API 回傳 `equityCurve` 與 `drawdownCurve`
- **THEN** web app SHALL 顯示資產曲線圖
- **AND** web app SHALL 顯示回撤曲線圖

#### Scenario: 顯示交易紀錄
- **WHEN** API 回傳 `tradeRecords`
- **THEN** web app SHALL 顯示交易紀錄表格
- **AND** 表格 SHALL 顯示日期、交易來源、成交價、股數、成交金額與交易後現金

#### Scenario: 不顯示結果說明文字段落
- **WHEN** API 回傳 suggestions、candidate warnings、頂層 warnings 與成本假設描述
- **THEN** web app SHALL NOT 將這些文字段落顯示在結果區塊

### Requirement: 目標模擬價格資料調整
目標導向模擬 SHALL 使用與 `member-backtesting` 一致的 adjusted OHLC 價格資料。

系統 SHALL 在執行買進持有模擬前，使用既有價格調整邏輯處理除權息、減資、面額變更與 ETF 分割造成的價格跳空。

#### Scenario: 使用調整後價格執行模擬
- **WHEN** API 取得指定 symbol 的 OHLC 資料
- **THEN** 系統 SHALL 先套用 adjusted OHLC
- **AND** 買進持有模擬 SHALL 使用調整後價格計算權益曲線

#### Scenario: 回應揭露價格調整假設
- **WHEN** 模擬完成
- **THEN** 回應 warnings SHALL 說明目標模擬使用調整後價格資料

### Requirement: 目標模擬交易成本假設
目標導向模擬 SHALL 在 response 中明確揭露交易成本假設。

`GoalSimulationResult.costAssumption` SHALL 包含：
- `mode`：`'ignored' | 'default-tw-equity'`
- `feeRate`：number 或 null
- `taxRate`：number 或 null
- `description`：字串

第一版若尚未扣除交易成本，`mode` SHALL 為 `ignored`，且 response SHALL 明確警示模擬結果未扣交易成本。UI SHALL 可用成本假設欄位顯示「未扣交易成本」，但 SHALL NOT 顯示成本假設描述或 warnings 的純文字段落。

若採用台股預設成本，`mode` SHALL 為 `default-tw-equity`，並 SHALL 揭露手續費率與證交稅率。

#### Scenario: 第一版忽略交易成本
- **WHEN** 目標模擬尚未將交易成本納入權益曲線
- **THEN** `costAssumption.mode` SHALL 為 `ignored`
- **AND** response warnings SHALL 說明結果未扣交易成本

#### Scenario: 使用台股預設成本
- **WHEN** 目標模擬採用台股預設交易成本
- **THEN** `costAssumption.mode` SHALL 為 `default-tw-equity`
- **AND** `feeRate` 與 `taxRate` SHALL 顯示實際使用的成本假設

### Requirement: 目標模擬現金流與報酬計算
目標導向模擬 SHALL 以一致的現金流排程計算目標金額、總投入與 money-weighted annualized return。

現金流排程 SHALL 包含：
- 初始本金：resolved start date 的現金流
- 每月投入：每月第一個可用交易日的現金流
- 期末資產：resolved end date 的現金流

`metrics.totalReturnPct` SHALL 使用期末資產相對總投入計算。

`metrics.annualizedReturnPct` SHALL 使用 XIRR 計算；若無法計算 SHALL 回傳 null 並揭露 warning。

#### Scenario: 每月投入排程一致
- **WHEN** 系統建立現金流排程
- **THEN** 目標金額反推、總投入與 XIRR SHALL 使用同一組投入日期

#### Scenario: 計算 money-weighted annualized return
- **WHEN** candidate 有有效的現金流與期末資產
- **THEN** `metrics.annualizedReturnPct` SHALL 由 XIRR 轉換為百分比

#### Scenario: 無法計算 money-weighted annualized return
- **WHEN** XIRR 無法收斂或現金流不符合計算條件
- **THEN** `metrics.annualizedReturnPct` SHALL 為 null
- **AND** candidate warnings SHALL 說明無法計算年化報酬

### Requirement: 第一階段實作範圍
`goal-based-strategy-simulation` SHALL 提供公開可執行的 API 與前端 UI。

第一階段 SHALL 支援 `single-symbol` universe 與固定 `buy-and-hold` baseline。

第一階段 SHALL NOT 支援 watchlist、market、multi-asset allocation、SMA、cash allocation、rolling-window 達成率或結果保存。

#### Scenario: 本變更完成後可呼叫目標模擬
- **WHEN** 本變更完整實作完成
- **THEN** 系統 SHALL 暴露 `POST /api/goal-simulation/run`
- **AND** web app SHALL 存在 goal-simulation UI 入口

#### Scenario: 第一版拒絕未支援範圍
- **WHEN** 使用者提交 watchlist、market、multi-asset allocation 或 rolling-window 模擬 request
- **THEN** 系統 SHALL 以驗證錯誤拒絕
