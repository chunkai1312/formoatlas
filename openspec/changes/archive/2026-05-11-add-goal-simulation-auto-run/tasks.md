## 1. OpenSpec

- [x] 1.1 新增 `autoRun=true` query param 需求
- [x] 1.2 驗證 change spec

## 2. 前端實作

- [x] 2.1 在 `GoalSimulationComponent` 讀取 `autoRun` query param
- [x] 2.2 在套用 query params 後自動呼叫既有 `runSimulation()`
- [x] 2.3 保留預設只初始化表單、不自動提交的行為

## 3. 測試與驗證

- [x] 3.1 更新前端單元測試：預設 query params 不自動提交
- [x] 3.2 新增前端單元測試：`autoRun=true` 會自動提交一次並使用 query params 組 request
- [x] 3.3 執行 `npx nx test web`
- [x] 3.4 執行 `openspec validate add-goal-simulation-auto-run --strict`
