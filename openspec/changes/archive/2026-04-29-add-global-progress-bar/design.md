## Context

FormoAtlas web app 目前沒有全域 loading indicator。各頁面可以用自己的 skeleton、空狀態或局部 loading 呈現資料載入，但使用者在切換路由、切換日期或同時觸發多個 API request 時，缺少一個一致的「系統正在處理」訊號。

現況觀察：

- Angular app shell 由 `app-toolbar`、`router-outlet`、assistant panel、登入提示 dialog 與 footer 組成。
- `app.config.ts` 目前使用 `provideHttpClient()`，尚未註冊 HTTP interceptor。
- Router 使用 standalone routes 與 blocking initial navigation。
- Agent streaming request 會長時間保持連線，assistant panel 已有自己的 streaming progress events，不適合納入全域 progress bar。

這個變更是前端橫切式 UI 行為，會同時碰到 app shell、router events、HTTP request lifecycle 與共用 styling。

## Goals / Non-Goals

**Goals:**

- 在 TopBar 上方加入類似 YouTube 的細線全域 progress bar。
- 追蹤 Angular router navigation、lazy route loading 與一般 HTTP API request。
- 用 active counter 管理並行活動，確保所有追蹤中的工作完成後才結束 progress。
- 對短 request 延遲顯示，避免快速閃爍。
- 完成時推進到 100%，短暫停留後淡出。
- 排除 agent streaming request，避免全域 progress bar 因長連線卡住。
- 讓功能集中在 app shell / core 層，不要求每個 feature page 手動接線。

**Non-Goals:**

- 不修改後端 API 或資料庫 schema。
- 不重構既有頁面 skeleton、局部 loading state 或錯誤狀態。
- 不追蹤 app initializer 階段發生、且 root component 尚未渲染前的 bootstrap request。
- 不提供真實 byte-level / server-side determinate progress；進度視覺是 client-side pseudo progress。

## Decisions

### Decision 1: 使用中央 `GlobalProgressService` 管理狀態

建立前端 core 層的 progress service，提供 `start(source)` / `done(token)` 或等價 API，內部維護 active count、visible state、progress percentage 與 timer。

理由：

- Router 與 HTTP interceptor 都能共用同一狀態來源。
- 並行 request 可以用 counter 清楚處理。
- 顯示延遲、完成淡出與防閃爍規則集中管理，避免分散在 component 內。

替代方案：

- 只在 component 裡監聽 router 與 HTTP：會讓跨來源狀態混在 UI component，測試與擴充較困難。
- 只依賴 Angular router loading：無法涵蓋頁面內 API request。

### Decision 2: 透過 functional HTTP interceptor 追蹤一般 API request

在 `provideHttpClient(withInterceptors([...]))` 註冊 progress interceptor。Interceptor 在 request 開始時通知 service，並用 RxJS `finalize` 確保 success、error 與 cancellation 都會結束 activity。

理由：

- 不需要改每個 data service。
- `finalize` 可以降低 counter leak 風險。
- 符合 Angular standalone provider 的既有架構。

替代方案：

- 在每個 service 呼叫前後手動控制 progress：容易遺漏，且會把全域 UI concern 滲入 feature code。

### Decision 3: Router tracking 由 app shell 初始化

在 root app component 或小型 root-level tracker service 監聽 `Router.events`。`NavigationStart` 與 lazy loading start 會啟動 progress；`NavigationEnd`、`NavigationCancel`、`NavigationError` 與 lazy loading end 會結束對應 activity。

理由：

- Router loading 與 HTTP loading 互補；路由切換即使尚未發出 HTTP request，也能提供 immediate feedback。
- 放在 app shell 層符合全域 UI 行為的責任邊界。

替代方案：

- 只追蹤 HTTP request：lazy route loading 或 route guard delay 時沒有 feedback。

### Decision 4: 明確排除 agent streaming request，並保留 skip context

Progress interceptor MUST 排除 agent streaming 類 request。另提供 `HttpContextToken` 或等價 opt-out 機制，讓未來其他長輪詢、SSE、下載或背景 request 可以跳過全域 progress。

理由：

- Agent streaming 是長時間互動狀態，納入全域 progress bar 會造成「永遠載入中」的錯覺。
- Skip context 能避免未來靠 URL pattern 堆疊特殊案例。

替代方案：

- 僅靠 URL 排除：初期簡單，但長期不夠彈性。

### Decision 5: 視覺採 pseudo progress，不改變頁面排版

Progress bar 固定在 viewport 最上方，位於 TopBar 上緣，使用 2px 或 3px 高度、既有色彩 token 或 accent 色。顯示時不推擠 layout；進度從低百分比開始，活動期間緩慢推進到約 85% 至 90%，完成時跳到 100% 後淡出。

理由：

- 符合使用者提到的 YouTube 式體驗。
- 不影響既有頁面寬度與內容排版。
- Pseudo progress 比不確定 loading spinner 更有方向感，但不需要後端回報真實進度。

替代方案：

- 放在 TopBar 下方：比較容易被頁面內容切斷視覺連續性，也不符合「導覽列上方」的需求。
- 使用全頁 overlay：干擾太強，和市場研究頁的密集資訊瀏覽不匹配。

### Decision 6: 延遲顯示與淡出由 service 統一控制

當 tracked activity 在短延遲內完成時，不顯示 progress bar。若已顯示，完成後必須推到 100%，短暫停留，再淡出。若淡出期間有新 activity，bar 回到 active 狀態並持續顯示。

理由：

- 短 request 不應造成閃爍。
- 新舊 request 密集交錯時，使用者看到的是連續、穩定的系統狀態。

替代方案：

- 每個 request 都立即顯示：會在快速 API request 上造成高頻閃爍。

## Risks / Trade-offs

- 全域 progress bar 可能過於吵雜 → 使用延遲顯示與 excluded request 降低噪音。
- 長時間 request 可能讓 progress 停在未完成狀態 → 排除 agent streaming，並提供 opt-out context 給其他長連線。
- Counter 可能因 error 或 cancellation 漏掉 decrement → Interceptor 使用 `finalize`，router tracking 必須處理 `NavigationCancel` 與 `NavigationError`。
- Pseudo progress 不代表真實後端進度 → 視覺只作為 loading feedback，不顯示百分比文字，避免誤導。
- Accessibility 上頻繁 announce 可能干擾螢幕閱讀器 → 頂部細線作為裝飾型狀態提示，預設不加入會反覆宣告的文字。

## Migration Plan

- 新增前端 progress service、HTTP interceptor、router tracking 與 component。
- 在 app shell 放置 progress bar component，位置在 toolbar 之前。
- 在 app provider 註冊 HTTP interceptor。
- 不需要資料 migration 或後端部署順序。
- Rollback 時移除 component/provider/interceptor 即可，既有頁面局部 loading state 不受影響。

## Open Questions

- 最終視覺高度採 2px 或 3px，實作時可依現有 TopBar 密度決定。
- 色彩優先使用哪個既有 token，實作時應掃描現有 CSS 變數並選擇最一致的 accent。
