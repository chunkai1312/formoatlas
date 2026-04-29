## Context

後端已提供受登入保護的 watch list API，並以 `string[]` 回傳與更新使用者追蹤的股票代號。前端已有 `WatchlistService`，提供 load/add/remove 方法與既有 panel state，但還沒有 route、頁面或可見的管理流程。TopBar 目前只顯示主要市場頁，研究助理 panel 則已有未登入時的登入提示。

本 change 讓自選股成為第一級市場工作流，同時不改變使用者資料的核心形狀。第一版在只有股票代號時也必須可用，但要保留後續接入股票 metadata 與 watchlist-aware agent 分析的路徑。

## Goals / Non-Goals

**Goals:**

- 新增 `/watchlist` 作為已登入使用者管理追蹤股票的主要頁面。
- 在 TopBar 與既有市場頁同層新增「自選股」入口。
- 自選股導覽、個股快速加入/移除與助理 FAB 未登入入口都使用一致的登入提示。
- 在個股密集的市場 UI 中提供快速自選切換，第一版從熱門個股排行列開始。
- 自選股頁面保持市場研究工具的資訊密度，以表格/列表為主，不做成卡片牆或設定頁。

**Non-Goals:**

- 不變更使用者 watch list API 的資料語意。
- 不實作持股成本、損益、券商串接或交易紀錄。
- 不新增 watchlist-aware agent tool、每日主動摘要、提醒或研究 artifact。
- 不要求所有 watch list symbol 都一定能解析到股票名稱；metadata 缺漏時必須 fallback 顯示代號。

## Decisions

1. **使用獨立 `/watchlist` route 作為主要 UI**

   自選股是高頻市場工作流，不是帳號設定。獨立 route 有足夠空間承載搜尋/輸入、清單管理、空狀態與後續每日摘要。Drawer 可以是未來的輔助入口，但不適合作為第一版主體驗。

   替代方案：用既有 `WatchlistService.isPanelOpen` 驅動側邊 panel。這會和研究助理 panel 搶空間，也不利於表格型管理。

2. **未登入時在導覽前先 gate**

   TopBar「自選股」入口應與助理入口一致：未登入使用者看到登入提示，而不是直接進入一個由 401 支撐的頁面。這能讓受保護功能入口一致，也避免使用者進入無公開內容的死路。

   替代方案：允許進入 `/watchlist` 後在頁面內顯示登入狀態。這與助理入口不一致，也會讓頁面看起來像載入失敗。

3. **保持 user watch list contract 不變**

   自選股管理仍使用既有 `GET /api/user/watchlist`、`POST /api/user/watchlist/:symbol` 與 `DELETE /api/user/watchlist/:symbol`。`User.watchList` 繼續儲存 `string[]`，不把股票名稱複製進使用者資料。

   後續決策：新增 narrow read-only ticker metadata endpoint，讓自選股頁面顯示名稱。metadata 來自市場 reference data；使用者 record 仍只保存代號。UI 查不到 metadata 時，保留 symbol-only fallback。

   效能決策：metadata endpoint 優先查 `Equity` reference collection。`Equity` 補上 `name` 欄位後，能透過穩定的 `{ symbol, exchange }` identity 取得名稱，資料量也遠小於歷史 `Ticker`。若 `Equity` 尚未 backfill，才 fallback 查最新 `Ticker` 行情。前端則以 session cache 避免同一 symbol 重複查詢。

4. **個股列使用星號切換自選**

   個股列使用 compact icon affordance：未加入顯示空心星號，已加入顯示實心星號。這符合 watch/favorite 心智模型，保留表格密度，也避免在排行列塞入過大的文字按鈕。

   替代方案：每列顯示「加入自選」文字按鈕。這會佔用過多水平空間，不適合密集排行表。

5. **預留 agent 整合但不實作 agent 分析**

   Watch list route 應保持未來可傳入 `route: 'watchlist'` context 的結構，但本 change 不改 agent runtime semantics、不新增 agent tools。

## Risks / Trade-offs

- **symbol-only 資料可能顯得單薄** -> 自選股列優先使用 metadata 顯示股票名稱；metadata 缺漏時仍清楚顯示代號。
- **metadata 查歷史 ticker 可能偏慢** -> 優先使用 `Equity` reference metadata，補上 ticker fallback index，並在前端 cache 當前 session 已查過的 metadata。
- **登入後可能遺失原始 intent** -> TopBar 導覽可以保留目標 route；個股快速加入的自動補加留待後續。
- **快速切換可能因連點造成狀態不同步** -> 單一 symbol request in-flight 時停用該 symbol 控制，並以 API 回傳的清單 reconcile。
- **TopBar 空間可能變擠** -> 桌機仍把「自選股」放在主要導覽；響應式行為沿用既有 TopBar 約束。
- **icon-only 控制可能不易讀** -> 每個星號控制都提供包含 symbol/name 的 `aria-label`。

## Migration Plan

不需要資料 migration。此 change 可隨正常 web/api deploy 發佈。`Equity.name` 是 reference data 的新增欄位，舊資料在下一次 equity profile 更新後會補上；補上前 metadata endpoint 會 fallback 查 `Ticker`。Rollback 時可移除 route、TopBar 入口、快速切換 UI 與 metadata endpoint，既有使用者 watch list 資料不受影響。

## Open Questions

- 是否要在後續 change 中為 OAuth callback 補上完整 intent restoration，讓登入後自動回到 `/watchlist` 或補加原本點選的 symbol？
