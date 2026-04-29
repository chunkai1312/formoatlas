## 1. Core Progress State

- [x] 1.1 新增 `GlobalProgressService`，管理 active activities、visible state、progress value 與 show/fade timers
- [x] 1.2 實作短活動延遲顯示、pseudo progress 推進、完成到 100% 後淡出的狀態轉換
- [x] 1.3 確保淡出期間有新 activity 時會取消淡出並回到 active 狀態

## 2. HTTP Tracking

- [x] 2.1 新增全域 progress HTTP interceptor，追蹤一般 API request lifecycle
- [x] 2.2 使用 `finalize` 或等價機制，確保 request 成功、錯誤或取消時都會結束 activity
- [x] 2.3 新增 skip progress context token 或等價 opt-out 機制
- [x] 2.4 排除 agent streaming request，避免長連線讓全域 progress bar 卡住

## 3. Router Tracking

- [x] 3.1 在 app shell 或 root-level tracker service 監聽 router navigation events
- [x] 3.2 於 `NavigationStart` 啟動 router progress activity，於 `NavigationEnd`、`NavigationCancel`、`NavigationError` 結束
- [x] 3.3 追蹤 lazy route loading start/end，確保 lazy loading 期間 progress 維持 active

## 4. UI Integration

- [x] 4.1 新增全域 progress bar component，從 `GlobalProgressService` 讀取 visible/progress 狀態
- [x] 4.2 將 component 放在 app shell 的 TopBar 上方
- [x] 4.3 新增固定在 viewport 最上方的 2px 或 3px progress bar styling，且不推擠頁面 layout
- [x] 4.4 使用既有色彩 token 或 accent 色，維持與目前導覽列視覺一致

## 5. Provider Wiring

- [x] 5.1 在 web app provider 註冊 progress HTTP interceptor
- [x] 5.2 確認既有 feature service 不需要手動修改即可觸發全域 progress
- [x] 5.3 對需要排除的 agent streaming 呼叫套用 skip progress 設定

## 6. Verification

- [x] 6.1 新增或更新 service unit tests，涵蓋 active counter、短活動不顯示、完成淡出與淡出期間新 activity
- [x] 6.2 新增或更新 interceptor tests，涵蓋成功、錯誤、取消、skip context 與 agent streaming 排除
- [x] 6.3 新增或更新 router tracking tests，涵蓋 navigation end/cancel/error 與 lazy route loading
- [x] 6.4 新增或更新 component rendering tests，確認 visible/progress 狀態與不影響 layout 的基本 class/style
- [x] 6.5 執行 web 測試與必要的 lint/build 驗證
