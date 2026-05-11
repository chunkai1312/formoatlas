## Why

目標模擬已支援 URL query params 初始化表單，但目前使用者打開分享連結後仍需要手動按下「執行模擬」。對於想直接分享特定假設與結果的情境，這會多一步操作。

新增明確 opt-in 的 `autoRun=true` query param，可以讓分享連結在頁面載入後自動執行一次，同時保留既有安全預設：一般 query params 仍只初始化表單，不會自動送出 API request。

## What Changes

- `/goal-simulation` 支援 `autoRun=true` query param。
- 當 URL 包含 `autoRun=true` 時，頁面套用 query params 後自動執行一次目標模擬。
- 未提供 `autoRun=true` 時，維持只初始化表單、不自動提交。
- 自動執行沿用既有表單狀態與 API request contract，不新增 API 欄位。
- 若使用者手動提交或 auto-run 進行中，既有 loading guard 仍避免重複送出。

## Capabilities

### Modified Capabilities

- `goal-based-strategy-simulation`：擴充目標模擬 UI 的 URL query params 行為，新增 `autoRun=true` 自動執行一次。

## Impact

- **前端**：`GoalSimulationComponent` 在初始化 query params 後依 `autoRun=true` 呼叫既有 `runSimulation()`。
- **後端**：無 API contract 變更。
- **測試**：補前端單元測試，覆蓋預設不自動提交與 `autoRun=true` 自動提交。
- **風險**：公開分享連結可直接觸發 API request；此變更只允許明確 opt-in，若流量上升再另開 rate limit/cache change。
