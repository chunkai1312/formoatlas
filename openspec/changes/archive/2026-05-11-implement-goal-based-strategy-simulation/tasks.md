## 1. 後端 API 與模型

- [x] 1.1 建立 `GoalSimulationModule`、controller、service、DTO 與 types
- [x] 1.2 在 `AppModule` 匯入 `GoalSimulationModule`
- [x] 1.3 以 `JwtAuthGuard` 保護 `POST /api/goal-simulation/run`
- [x] 1.4 實作 `RunGoalSimulationDto` 驗證：目標欄位至少一個、single-symbol universe、金額、年限與日期格式
- [x] 1.5 將第一版 request 收斂為固定 buy-and-hold，不要求 candidateStrategies 或 strategyParams
- [x] 1.6 定義 `GoalSimulationResult` 與 buy-and-hold candidate response contract

## 2. 模擬計算

- [x] 2.1 使用 `TickerRepository.getOhlcBySymbol()` 取得 requested range OHLC
- [x] 2.2 使用 `AdjustedPriceService.adjustOhlc()` 產生 adjusted OHLC
- [x] 2.3 實作日期區間解析：支援自訂 startDate/endDate，未填時依 horizonYears 推導
- [x] 2.4 驗證 startDate 不晚於 endDate，並在資料不足時回傳可讀錯誤
- [x] 2.5 實作目標金額解析：直接使用 targetAmount 或由 targetAnnualReturnPct 反推
- [x] 2.6 抽出每月第一個可用交易日的 contribution schedule
- [x] 2.7 讓目標反推、總投入與 XIRR 使用同一組現金流排程
- [x] 2.8 實作買進持有：期初與每月投入盡量買進整股並持有
- [x] 2.9 計算 final value、以期末權益總值相對目標金額的 goal attainment、target gap、total return、XIRR、max drawdown 與 worst period
- [x] 2.10 回傳 equityCurve 與 drawdownCurve，且兩條曲線使用同一組交易日期
- [x] 2.11 回傳 adjusted price 與未扣交易成本 warnings / costAssumption
- [x] 2.12 回傳買進持有實際成交的 tradeRecords

## 3. 前端 UI

- [x] 3.1 新增 `GoalSimulation` model 與 Angular service
- [x] 3.2 新增 `/goal-simulation` route 與頁面元件
- [x] 3.3 未登入時顯示登入提示，不暴露提交 action
- [x] 3.4 已登入時顯示目標設定表單：目標金額/年化報酬、年限、日期區間、初始本金、每月投入、最大回撤、股票代號
- [x] 3.4.1 股票代號預設為 `0050`
- [x] 3.4.2 支援 URL query params 初始化目標模擬表單設定
- [x] 3.5 移除策略 checkbox、SMA 參數與股票配置百分比欄位
- [x] 3.6 提交 request 時不送出 candidateStrategies 或 strategyParams
- [x] 3.7 顯示買進持有結果：達成率、權益總值、缺口、總報酬、年化報酬、最大回撤與日期區間
- [x] 3.8 顯示成本假設摘要，但不顯示 suggestions、warnings 或成本描述的純文字段落
- [x] 3.9 重用既有 chart component 顯示資產曲線與回撤曲線
- [x] 3.10 在導覽列加入目標模擬入口
- [x] 3.11 在結果區顯示交易紀錄表格

## 4. 測試與驗證

- [x] 4.1 後端單元測試：guard、DTO/service 驗證、有效 request、目標欄位缺失、unsupported universe
- [x] 4.2 後端單元測試：自訂日期區間、預設日期區間、startDate 晚於 endDate
- [x] 4.3 後端單元測試：buy-and-hold、adjusted OHLC、XIRR、target 年化反推與曲線欄位
- [x] 4.4 前端單元測試：登入 gate、表單提交、日期欄位、URL query params、無策略欄位、結果呈現、圖表顯示與交易紀錄
- [x] 4.5 執行 `npx nx test api` 與 `npx nx test web`
- [x] 4.6 執行 `npx nx build api` 與 `npx nx build web`

## 5. OpenSpec

- [x] 5.1 將 goal simulation 相關 active changes 整併為 `implement-goal-based-strategy-simulation`
- [x] 5.2 執行 `openspec validate implement-goal-based-strategy-simulation --strict`
