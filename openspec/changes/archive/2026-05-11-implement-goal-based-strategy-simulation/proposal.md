## Why

`member-backtesting` 已提供單一策略的歷史回測，但使用者提出的買房/財務目標情境需要先設定目標、期限、投入條件與可接受風險，再檢查指定歷史區間中的投資結果是否接近目標。

先前 goal simulation 相關變更一度擴張為多策略比較，後續產品決策已收斂為更容易理解的第一版 baseline：單一股票買進持有。為避免多個 active change 對同一 capability 互相覆蓋，本變更整併 API、前端 UI、日期區間、contract 精修、價格調整、XIRR、成本揭露與圖表需求。

## What Changes

- 新增會員限定的目標導向買進持有模擬 API：`POST /api/goal-simulation/run`。
- 新增 `GoalSimulationModule`，與 `BacktestingModule` 分離，但共用既有 OHLC 與 adjusted price 邏輯。
- 第一版支援 `single-symbol` universe，固定執行 `buy-and-hold`，不暴露策略選擇、SMA 或配置比例。
- Request 支援目標金額或目標 money-weighted 年化報酬、投資年限、歷史模擬日期區間、初始本金、每月投入、最大回撤容忍與單一股票代號。
- Response 回傳 requested/resolved range、target、cashflow、costAssumption、單一 buy-and-hold candidate、資產曲線、回撤曲線與必要 warnings。
- 年化報酬使用 XIRR；目標年化反推、總投入與 XIRR 使用同一組現金流排程。
- 目標模擬使用與 member backtesting 一致的 adjusted OHLC。
- 第一版不扣交易成本，但 response 與 UI 以成本假設揭露「未扣交易成本」。
- 前端新增 `/goal-simulation` 頁面與導覽入口；未登入使用者只看到登入提示。
- 輸出以歷史情境模擬呈現，不提供保證達成、買賣指令或投資建議。

## Capabilities

### New Capabilities

無。`goal-based-strategy-simulation` capability 已存在，本變更整併並實作該 capability。

### Modified Capabilities

- `goal-based-strategy-simulation`：實作會員限定目標導向買進持有模擬，包含 API、前端 UI、日期區間、XIRR、adjusted OHLC、成本揭露、資產曲線與回撤曲線。

## Impact

- **後端**：新增 `apps/api/src/app/goal-simulation/` module、controller、service、DTO、types 與測試；在 `AppModule` 匯入 `GoalSimulationModule`。
- **前端**：新增 `GoalSimulationService`、model、目標模擬頁面、route 與 toolbar 入口。
- **資料來源**：使用 `TickerRepository.getOhlcBySymbol()` 查詢歷史 OHLC，並透過 `AdjustedPriceService.adjustOhlc()` 調整價格。
- **權限**：API 以 `JwtAuthGuard` 保護，僅會員可執行。
- **資料庫**：第一版不保存模擬結果。
- **API 相容性**：此功能尚未歸檔為穩定能力，整併後 contract 以本 change 為準。
