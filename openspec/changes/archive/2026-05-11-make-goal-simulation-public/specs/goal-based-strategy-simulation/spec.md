## MODIFIED Requirements

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
