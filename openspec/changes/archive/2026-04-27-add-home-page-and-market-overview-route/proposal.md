## Why

目前 `/` 直接載入「大盤籌碼」頁，導致首頁、功能頁與 agent context `dashboard` 混在一起；品牌 logo/name 也沒有明確的首頁導向。新增「每日市場地圖」首頁並把現行大盤頁移到明確 route，可以讓 FormoAtlas 的入口、導覽與 AI context 語意更清楚。

## What Changes

- 新增 `/` 首頁，作為「每日市場地圖」，以選取日期呈現「大盤氣候、資金移動、個股焦點」三個市場快照維度。
- 將現行大盤籌碼頁改為 `/market-overview`，顯示名稱改為「大盤總覽」，並保留既有晴雨表、大盤走勢、今日籌碼速覽與籌碼指標趨勢內容。
- 更新 TopBar：logo 與 `FormoAtlas` 品牌名稱 SHALL 導向 `/`；導覽列只呈現功能頁「大盤總覽」、「資金流向」、「熱門個股」。
- 更新 route 與 active 狀態：`/market-overview` 對應大盤總覽 active link，`/` 不再讓大盤頁 active。
- 更新 market research agent page context：首頁使用 `home`，大盤總覽使用 `market-overview`，不再使用 `dashboard`。
- 首頁維持資料產品入口語氣，不做 marketing landing page；第一版只呈現輕量摘要與功能入口，不重做完整圖表。

## Capabilities

### New Capabilities

- `market-map-home`: 定義每日市場地圖首頁的 route、內容結構、資料狀態與入口行為。

### Modified Capabilities

- `topbar-navigation`: 將品牌 logo/name 改為首頁連結，並將大盤功能頁 route/label 改為 `/market-overview` / 「大盤總覽」。
- `market-research-agent`: 將 page context 命名調整為 `home`、`market-overview`、`sector-flow`、`hot-stocks`，移除 `dashboard` context 語意。

## Impact

- Frontend routing：新增首頁 component/route，將現行 `DashboardComponent` route 從 `/` 移到 `/market-overview`。
- Frontend layout：TopBar logo/name 需要可點擊並導向首頁，nav links 與 active 狀態需調整。
- Frontend data：首頁需讀取既有 barometer、sector-flow、hot-stocks 等資料，並各自處理 loading/empty/error 狀態。
- Agent context：更新頁面寫入 `ResearchAssistantContextService` 的 context route 名稱。
- Specs：新增 `market-map-home` spec，修改 `topbar-navigation` 與 `market-research-agent` specs。
