## ADDED 需求

### 需求：目標導向模擬請求模型
系統 SHALL 定義 `GoalSimulationRequest` 模型，供未來目標導向策略模擬功能實作使用。

請求模型 SHALL 包含以下欄位：
- `targetAmount`：number（選填）— 期望的最終投資組合價值
- `targetAnnualReturnPct`：number（選填）— 期望的年化報酬率
- `horizonYears`：number（必填）— 投資年限
- `initialCapital`：number（必填）— 初始本金
- `monthlyContribution`：number（必填）— 每月定期投入金額（純單筆投入時填 0）
- `maxDrawdownTolerancePct`：number（選填）— 可接受的最大回撤幅度
- `universe.type`：`'single-symbol' | 'watchlist' | 'market' | 'allocation'`（必填）
- `universe.symbols`：string[]（選填；當 type 為 `single-symbol` 或 `watchlist` 時為必填）
- `candidateStrategies`：`'sma-cross' | 'momentum' | 'allocation-model'` 的陣列（必填；不可為空）

`targetAmount` 與 `targetAnnualReturnPct` 至少需提供其中一個。

#### 情境：有效的目標模擬請求
- **當** 請求提供 `horizonYears`、`initialCapital`、`monthlyContribution`、至少一個目標欄位，以及至少一個候選策略
- **則** 系統接受該請求為有效

#### 情境：兩個目標欄位皆缺失
- **當** 請求同時省略 `targetAmount` 與 `targetAnnualReturnPct`
- **則** 系統以驗證錯誤拒絕請求

#### 情境：單一標的 universe 未提供 symbols
- **當** `universe.type` 為 `single-symbol`，但 `universe.symbols` 為空或未提供
- **則** 系統以驗證錯誤拒絕請求

### 需求：目標導向模擬回應模型
系統 SHALL 定義 `GoalSimulationResult` 模型，描述目標導向模擬執行的輸出結果。

回應 SHALL 包含候選策略結果列表，每筆結果包含：
- `strategy`：策略識別碼
- `universe`：解析後使用的標的或配置
- `goalAttainmentRate`：number — 模擬情境中達成目標的比例（0–100）
- `metrics`：`annualizedReturnPct`、`maxDrawdownPct`、`worstPeriod`（日期區間 + drawdownPct）
- `suggestions`：字串陣列 — 例如建議增加投入金額、延長年限或降低目標報酬率
- `warnings`：字串陣列 — 包含必要的風險揭露

回應頂層 SHALL 同時包含一個 `warnings` 陣列，提供必要的風險揭露聲明。

#### 情境：目標達成率高於門檻
- **當** 某候選策略在歷史上大多數模擬期間均達成目標
- **則** `goalAttainmentRate` 偏高，`suggestions` 可能為空或極少

#### 情境：目標達成率低於門檻
- **當** 沒有任何候選策略能穩定達成目標
- **則** `suggestions` 包含建議，引導使用者提高投入金額、延長年限或降低目標報酬率

#### 情境：回應中包含必要風險揭露
- **當** 模擬完成
- **則** `warnings` 包含「歷史情境模擬，不構成投資建議，不保證未來績效。」

### 需求：與 member-backtesting 的職責分離
`goal-based-strategy-simulation` SHALL 作為獨立 capability 實作，與 `member-backtesting` 分開。

`member-backtesting` capability 回答的是「這個策略在過去這段期間的表現如何」。

`goal-based-strategy-simulation` capability 回答的是「在指定目標與風險限制下，哪些候選策略歷史上比較接近目標」。

兩個 capability MAY 共用底層歷史模擬引擎，但 SHALL 具備各自獨立的 API 端點、請求/回應合約及 UI 入口。

#### 情境：Backtesting API 不因目標模擬而異動
- **當** 目標導向模擬功能實作完成
- **則** `POST /api/backtesting/run` 合約維持不變

#### 情境：目標模擬使用獨立端點
- **當** 使用者發起目標導向模擬
- **則** 請求送至獨立端點（例如 `POST /api/goal-simulation/run`）
- **且** 回應遵循 `GoalSimulationResult` 合約

### 需求：命名與模型保留
`goal-based-strategy-simulation` 的 API 路由、TypeScript 型別及 Angular 服務名稱 SHALL 保留，不得由 `member-backtesting` 重複使用。

`member-backtesting` 的實作 SHALL 不引入會與未來 `goal-based-strategy-simulation` 模組衝突的名稱或模組路徑。

#### 情境：模組命名慣例
- **當** `member-backtesting` 實作完成
- **則** 後端模組命名為 `BacktestingModule`（而非 `GoalSimulationModule`）
- **且** 前端服務命名為 `BacktestingService`（而非 `GoalSimulationService`）

### 需求：候選策略比較輸出
`goal-based-strategy-simulation` 輸出 SHALL 以候選策略比較的形式呈現，而非推薦單一策略。

輸出 SHALL NOT 聲稱任何策略必然達成目標，SHALL 呈現歷史達成率與各策略的取捨。

#### 情境：多個候選策略比較
- **當** `candidateStrategies` 包含兩個以上的策略
- **則** 回應列出每個策略的結果
- **且** 沒有任何策略被標記為「保證」或「推薦」

#### 情境：單一候選策略
- **當** `candidateStrategies` 僅包含一個策略
- **則** 回應呈現該策略的達成率與建議
- **且** 風險揭露聲明包含其中

### 需求：第一階段範圍（尚未實作）
`goal-based-strategy-simulation` 在 `add-member-backtesting` 變更中僅定義模型層級，SHALL NOT 在該變更的第一階段實作。

後續獨立變更 SHALL 實作 `goal-based-strategy-simulation` 端點與 UI。

`member-backtesting` 的實作 SHALL 在命名、模組結構及回應格式上保持與未來擴充目標導向模擬的相容性。

#### 情境：第一階段無法呼叫目標模擬
- **當** `add-member-backtesting` 變更完整實作完成
- **則** 不暴露任何 `goal-simulation` 端點
- **且** 不存在任何 goal-simulation UI 元件
