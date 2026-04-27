## 1. Routing and Naming

- [x] 1.1 新增首頁 feature component，作為 `/` route 的每日市場地圖首頁。
- [x] 1.2 將現行大盤頁 route 從 `/` 移到 `/market-overview`。
- [x] 1.3 將大盤功能頁使用者可見名稱調整為「大盤總覽」。
- [x] 1.4 視實作成本決定是否將 `DashboardComponent` 命名重構為 `MarketOverviewComponent`；若暫不重構，需確保 route/context 已使用 `market-overview`。

## 2. Home Page Experience

- [x] 2.1 首頁以 selected date 並列呈現「大盤氣候、資金移動、個股焦點」市場快照維度。
- [x] 2.2 大盤氣候區塊使用既有 barometer/market data service 顯示晴雨等級、加權指數、成交金額或缺資料狀態，並提供 `/market-overview` 入口。
- [x] 2.3 資金移動區塊使用既有 sector-flow service 顯示類股資金流摘要或缺資料狀態，並提供 `/sector-flow` 入口。
- [x] 2.4 個股焦點區塊使用既有 hot-stocks service 顯示熱門個股摘要或缺資料狀態，並提供 `/hot-stocks` 入口。
- [x] 2.5 各首頁區塊獨立處理 loading、empty 與 error 狀態，單一資料來源失敗時不阻塞其他區塊。
- [x] 2.6 首頁視覺應保持資料產品入口語氣，避免 marketing landing page composition。

## 3. TopBar Navigation

- [x] 3.1 讓 TopBar logo 與 `FormoAtlas` 品牌名稱可點擊並導向 `/`。
- [x] 3.2 將導覽列「大盤籌碼」改為「大盤總覽」，並連到 `/market-overview`。
- [x] 3.3 確保 `/` 首頁不讓任何功能 nav link 顯示 active。
- [x] 3.4 確保 `/market-overview`、`/sector-flow`、`/hot-stocks` 分別正確顯示 active pill。

## 4. Research Assistant Context

- [x] 4.1 首頁將 `ResearchAssistantContextService` route context 設為 `home`。
- [x] 4.2 大盤總覽頁將 route context 從 `dashboard` 改為 `market-overview`。
- [x] 4.3 確認資金流向與熱門個股頁維持 `sector-flow` 與 `hot-stocks` context。
- [x] 4.4 更新任何測試或 fixture 中的舊 `dashboard` context 命名。

## 5. Verification

- [x] 5.1 新增或更新 routing/TopBar tests，涵蓋品牌回首頁、`/market-overview` active 狀態與首頁無功能 active 狀態。
- [x] 5.2 新增或更新首頁 component tests，涵蓋市場快照維度與資料 fallback 狀態。
- [x] 5.3 新增或更新 research assistant context tests，確認首頁與大盤總覽 context。
- [x] 5.4 執行 web tests。
- [x] 5.5 執行 web build。
- [x] 5.6 手動檢查首頁、TopBar、`/market-overview`、研究助理 context 與 mobile layout。

## 6. Home Page Refinement

- [x] 6.1 將首頁從三張功能入口卡片調整為市場地圖版面。
- [x] 6.2 補上今日市場摘要列，讓首頁更符合方案 B 的市場地圖語氣。
- [x] 6.3 在 desktop 使用三欄快照，在 mobile 使用垂直堆疊，降低 CTA launcher 感。

## 7. B1 Market Snapshot Refinement

- [x] 7.1 更新 design/spec，將首頁定位調整為 B1「每日市場快照」，避免強流程式引導。
- [x] 7.2 將首頁標題與摘要文案從「市場導讀」調整為「市場快照」。
- [x] 7.3 移除首頁強流程箭頭與 connector，改為三個市場維度並列快照。
- [x] 7.4 新增今日市場摘要 panel，優先呈現可用資料的主訊號，資料不足時保持中性 fallback。
- [x] 7.5 將功能頁 CTA 視覺降權重，避免首頁像功能入口集合。
- [x] 7.6 更新首頁 component tests 覆蓋市場快照與摘要 fallback。
- [x] 7.7 執行 web tests、web build 與 OpenSpec validate。
