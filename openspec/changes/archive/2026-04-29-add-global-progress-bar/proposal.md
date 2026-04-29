## Why

FormoAtlas 的市場頁會在切頁、切日期與載入資料時同時發出多個 API request；目前使用者只能從局部 skeleton 或空狀態推測系統是否正在處理。新增全域 progress bar 可以提供一致、低干擾的 loading feedback，讓 app 在資料查詢與路由切換期間更有明確狀態。

## What Changes

- 新增位於 TopBar 上方的全域 progress bar，呈現類似 YouTube 的細線進度效果。
- 追蹤 Angular router navigation 與 lazy route loading。
- 透過 HTTP interceptor 追蹤一般 API request。
- 使用 active counter 管理並行活動，直到全部完成才結束 progress。
- 延遲顯示短請求，避免快速 request 造成閃爍。
- 完成時將 progress 推到 100%，短暫停留後淡出。
- 排除 agent streaming request，避免長時間 streaming 讓全域 progress bar 卡住；agent panel 仍使用自己的 streaming progress events。
- 不改後端 API、不重構既有頁面局部 loading state。

## Capabilities

### New Capabilities

- `global-progress-indicator`: 定義全域 progress bar 的顯示位置、觸發來源、並行請求處理、短請求防閃爍、完成淡出與 excluded requests。

### Modified Capabilities

- 無。

## Impact

- 前端 app shell：新增全域 progress bar component，放在 toolbar 上方。
- 前端 core services/interceptors：新增 progress service 與 HTTP interceptor。
- 前端 router integration：在 root/app shell 層監聽 router navigation events。
- Styling：新增 2px 或 3px 高的固定頂部 progress bar，使用既有色彩 token。
- Tests：新增 progress service、HTTP interceptor、router integration 與 component rendering tests。
