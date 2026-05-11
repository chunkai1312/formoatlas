## Context

`/goal-simulation` 已支援 `symbol`、`targetMode`、`targetAmount`、`targetAnnualReturnPct`、`horizonYears`、`startDate`、`endDate`、`initialCapital` 與 `monthlyContribution` query params。這些參數目前只初始化表單，符合安全預設，但不方便直接分享可重現的模擬結果。

## Decision

新增 query param：`autoRun=true`。

當 `autoRun=true` 存在時，元件在建構時先套用所有 query params，再呼叫既有 `runSimulation()`。不把 `autoRun` 放進 API request，因為它只是前端載入行為。

## Rationale

選擇 `autoRun=true` 而非改成所有 query params 自動執行，原因是：

- 避免使用者只想預填表單時意外打 API。
- 分享連結的自動行為清楚可讀。
- 未來若需要追蹤或限制自動入口，可以用 URL param 明確辨識。
- 沿用既有 `runSimulation()` 可避免產生第二套 request 組裝邏輯。

## Behavior

- `autoRun=true`：套用 query params 後自動執行一次。
- `autoRun` 省略、空值或非 `true`：只初始化表單。
- 參數大小寫採嚴格比對，只接受小寫 `true`。
- 自動執行期間若使用者再次提交，既有 `loading()` guard 阻止重複 request。

## Non-goals

- 不新增 API request 欄位。
- 不新增結果保存。
- 不新增 rate limit 或 cache。
- 不處理 query params 雙向同步。
