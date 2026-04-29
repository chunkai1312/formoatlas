## Why

FormoAtlas 已經具備受登入保護的自選股 API，但使用者尚未有第一級的 UI 來管理追蹤股票，也無法直接從市場頁把看到的個股加入自選。補上自選股管理體驗，可以立刻支援每日盤後工作流，也為後續市場研究助理提供使用者個人化脈絡。

## What Changes

- 新增 `/watchlist` 頁面，讓已登入使用者載入、新增與移除追蹤股票。
- 在 TopBar 主要市場導覽中新增「自選股」入口。
- 未登入使用者開啟自選股功能時，重用研究助理入口一致的「需要登入」提示。
- 在已有個股列的市場頁加入快速自選操作，第一版從熱門個股排行開始。
- 自選股頁面透過 read-only ticker metadata 從市場資料解析股票名稱，並以「股票名稱 / 股票代號」呈現。
- 自選股管理支援空狀態、載入中狀態與可恢復錯誤狀態。
- 本 change 聚焦自選股管理 UI；watchlist-aware agent 分析、主動盤後摘要與提醒留待後續 change。

## Capabilities

### New Capabilities

- 無。

### Modified Capabilities

- `user-watchlist`: 補上前端管理 UI 需求，包含查詢、新增、移除、空狀態、未登入 gating、快速自選切換、股票名稱顯示與 metadata 快取。
- `topbar-navigation`: 新增 TopBar「自選股」入口、`/watchlist` route 行為、active 狀態與未登入點擊處理。
- `market-research-agent`: 讓未登入使用者點選右下方助理 FAB 時，改為顯示共用登入提示，而不是先打開助理 panel。

## Impact

- 前端路由與 layout：新增 lazy-loaded watch list page 與 TopBar 導覽入口。
- 前端服務與元件：重用 `WatchlistService`、auth 狀態與共用登入提示。
- 市場頁：在可行的個股列加入快速新增/移除自選控制，第一版套用於熱門個股排行。
- 後端使用者 API：不變更既有 `GET/POST/DELETE /api/user/watchlist` 行為。
- 市場資料 API：新增 read-only ticker metadata 查詢，用於自選股顯示名稱；不改變 user watch list schema。
- Agent 行為：不新增 agent runtime tool；僅調整未登入 FAB 入口體驗，保留未來 watchlist-aware analysis 的乾淨接點。
