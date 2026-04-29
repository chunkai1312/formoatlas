## 1. 路由與導覽

- [x] 1.1 新增 lazy-loaded `/watchlist` route，載入自選股管理頁面。
- [x] 1.2 在 TopBar 主要導覽群組新增「自選股」，並支援 `/watchlist` active 樣式。
- [x] 1.3 未登入使用者點選 TopBar「自選股」時，先顯示共用登入提示，而不是直接導向頁面。

## 2. 自選股頁面

- [x] 2.1 在 `apps/web/src/app/features/watchlist/` 建立自選股頁面 component。
- [x] 2.2 透過 `WatchlistService` 載入已登入使用者的 watch list，並呈現 loading、success、empty 與 error states。
- [x] 2.3 新增股票代號輸入流程，在呼叫 add API 前 trim 並 normalize 使用者輸入。
- [x] 2.4 新增 row-level 移除控制，並以 API 回傳的 watch list 更新畫面。
- [x] 2.5 提供 empty state，包含新增 symbol 入口與前往熱門個股頁面的連結。
- [x] 2.6 新增 read-only ticker metadata lookup，並以「股票名稱 / 股票代號」呈現；metadata 缺漏時 fallback 顯示 symbol。
- [x] 2.7 優化 ticker metadata lookup：優先使用 Equity reference data，保留 Ticker fallback，並在前端 cache metadata 結果。

## 3. 登入提示

- [x] 3.1 重用或抽出既有助理登入提示 UI，讓自選股導覽與快速切換使用一致的登入提示。
- [x] 3.2 確保未登入狀態不會在使用者完成登入前呼叫 watch list APIs。
- [x] 3.3 將登入操作接到既有 Google auth flow。
- [x] 3.4 未登入使用者點選助理 FAB 時，先顯示共用登入提示，不打開助理 panel。

## 4. 市場頁快速自選切換

- [x] 4.1 在熱門個股排行列新增 compact watch list star controls。
- [x] 4.2 已登入使用者查看熱門個股時載入 watch list state，並依 symbol 顯示已選/未選狀態。
- [x] 4.3 實作 add/remove 快速切換，包含單一 symbol in-flight 保護與 API 回傳清單 reconcile。
- [x] 4.4 未登入使用者啟用快速切換時，顯示共用登入提示。
- [x] 4.5 為 add/remove icon controls 提供包含目標 symbol 的 accessible labels。

## 5. 測試與驗證

- [x] 5.1 新增或更新 route tests，涵蓋 `/watchlist` lazy loading。
- [x] 5.2 新增 watch list page tests，涵蓋載入成功、empty state、新增、移除與 API failure handling。
- [x] 5.3 新增 TopBar tests，涵蓋「自選股」active state 與未登入登入提示。
- [x] 5.4 新增 hot stocks ranking row tests，涵蓋 selected state、add/remove calls、未登入 gating 與 duplicate in-flight protection。
- [x] 5.5 執行相關 web tests、lint 與 build checks，驗證變更的前端 surface。
