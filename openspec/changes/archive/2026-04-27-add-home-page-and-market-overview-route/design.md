## Context

目前 Angular routes 將 `/` 直接對應到 `DashboardComponent`，TopBar 的「大盤籌碼」也連到 `/`。這讓首頁、主要功能頁與 agent context `dashboard` 混在一起；近期加入的市場研究助理也會把大盤頁脈絡送成 `dashboard`，語意不夠精準。

這次變更會把 `/` 重新定位為「每日市場地圖」首頁，將現行大盤頁移到 `/market-overview`，並讓 TopBar 品牌區明確作為回首頁入口。

## Goals / Non-Goals

**Goals:**

- 將 `/` 改為每日市場地圖首頁，提供 date-centered 的市場快照入口。
- 將現行大盤頁移至 `/market-overview`，顯示名稱改為「大盤總覽」。
- 更新 TopBar 品牌 logo/name，使其點擊後導向 `/`。
- 保留現有功能頁：資金流向 `/sector-flow`、熱門個股 `/hot-stocks`。
- 將 agent context 命名改為 `home`、`market-overview`、`sector-flow`、`hot-stocks`。

**Non-Goals:**

- 不改變既有 marketdata API response shape。
- 不重做大盤總覽、資金流向或熱門個股頁面的核心內容。
- 首頁第一版不加入完整圖表，不取代各功能頁。
- 不做 marketing landing page；首頁仍是資料產品入口。

## Decisions

### `/` 成為每日市場地圖首頁

首頁呈現「大盤氣候、資金移動、個股焦點」三個市場快照維度。每個區塊是輕量摘要與功能入口，而不是完整分析頁；首頁不應將三個維度表現成強制使用流程。

理由：FormoAtlas 的定位是「以日期翻閱島嶼股海，讀懂每日留下的紅綠線索」。首頁應提供每日市場切面，而不是只做功能清單、操作流程或 marketing hero。

曾考慮的替代方案：維持 `/` 為大盤頁並新增首頁到 `/home`。這會違反一般使用者對品牌/logo 回首頁的期待，也延續目前首頁與大盤頁混淆。

### 首頁採用 B1 市場快照型

首頁應以「每日市場快照」作為主要形態：提供今日市場摘要，並列呈現大盤氣候、資金移動、個股焦點三個維度。三個維度是資訊分類邏輯，不是強制使用者依序操作的流程。

理由：首頁應保持資料產品的克制語氣，呈現可掃描的市場切面，而不是指示使用者下一步應該點哪裡或如何讀盤。

曾考慮的替代方案：使用強流程型首頁，以「先看大盤 → 再看資金 → 最後看個股」作為主要版面。這會讓首頁像操作教學或功能導覽，對熟悉市場的使用者過度引導。

大盤氣候卡片只呈現晴雨等級、加權指數與成交金額等短訊號。晴雨等級應置於加權指數上方，先讓使用者看到市場氣候，再掃描指數與成交金額。Barometer 的長篇摘要應留在大盤總覽頁，避免首頁單一卡片高度失衡，也避免首頁承載過多分析敘述。數字排版可參考大盤總覽頁的加權指數與成交金額樣式。

資金移動卡片應呈現產業成交比重與成交比重變化，避免只顯示變化量。首頁使用 `%` 單位，不使用 `pct`，讓使用者同時看到目前比重與變化方向。首頁快照顯示前 5 筆，完整排行留在資金流向頁。

個股焦點卡片採用成交值排行作為首頁焦點資料，並同時顯示成交值與漲跌幅，避免混用漲幅榜與法人買超造成語意不一致。首頁快照顯示前 5 筆，更細的排行與法人維度留在熱門個股頁。

### 大盤頁改為 `/market-overview`

現行 `DashboardComponent` 的功能內容會對應到 `/market-overview`，顯示 label 改為「大盤總覽」。

理由：現行頁面包含晴雨表、大盤走勢、今日籌碼速覽與籌碼指標趨勢，不只是「大盤籌碼」。`market-overview` 與「大盤總覽」更能容納此頁內容，也比 `dashboard` 更適合作為 agent context。

曾考慮的替代方案：使用 `/market-chips` 或 `/market-data`。前者過窄，後者過泛；`market-overview` 在 route 與 context 上較清楚。

### TopBar 品牌區回首頁，Nav 只放功能頁

TopBar logo 與 `FormoAtlas` 品牌名稱導向 `/`。導覽列只放功能頁：「大盤總覽」、「資金流向」、「熱門個股」。

理由：品牌區作為 home affordance 是常見互動模式；nav links 則應代表可工作的主要功能頁。首頁不需要作為 nav pill 顯示，避免 active 狀態與功能頁競爭。

曾考慮的替代方案：在 nav links 顯示「首頁」。這會增加一個低價值 nav item，也讓功能導覽變得不夠聚焦。

### 首頁使用既有資料服務的輕量摘要

首頁可使用既有 frontend services 呼叫：

- `barometer`：呈現大盤氣候與短摘要
- `sector-flow`：呈現資金移動的強勢類股摘要
- `hot-stocks`：呈現個股焦點摘要

每個區塊應獨立處理 loading/error/empty 狀態，避免單一資料失敗導致整頁不可用。

理由：首頁是入口層，不應重新實作各功能頁的完整圖表或複雜互動。使用既有 endpoint 可降低風險並保持資料語意一致。

曾考慮的替代方案：新增一個聚合首頁 API。這可能降低前端協調，但目前首頁摘要仍輕量，先重用既有 API 較直接。

### Agent Context 重新命名

頁面送給研究助理的 route/context 改為：

- `home`
- `market-overview`
- `sector-flow`
- `hot-stocks`

理由：`dashboard` 不再代表任何明確產品頁，也不利於 agent 產生精準回覆。context 名稱應對齊 route 與使用者可見頁面語意。

## Risks / Trade-offs

- `/` route 行為改變可能影響既有使用者記憶 -> TopBar 提供「大盤總覽」明確入口，必要時可考慮後續加入舊路徑 alias。
- 首頁同時呼叫多個資料來源可能增加 loading/error 狀態複雜度 -> 各區塊獨立處理狀態，整頁不因單區塊失敗而失效。
- 「每日市場地圖」如果資料太少可能顯得空洞 -> 首頁提供今日市場摘要與三個維度的缺資料 fallback，避免產生誤導性結論。
- Component 命名可能仍保留 `DashboardComponent` -> 可先改 route/context，再視實作成本決定是否同步重命名 component；需求層面以 route/context 為準。

## Migration Plan

1. 新增首頁 route/component，將 `/` 指向每日市場地圖。
2. 將現行大盤頁 route 改到 `/market-overview`。
3. 更新 TopBar logo/name link、nav labels、routerLinks 與 active 狀態。
4. 更新研究助理 context wiring，移除 `dashboard` context。
5. 新增/更新相關 frontend tests，驗證 route、TopBar 與 context 行為。
6. 驗證 web build/test。

Rollback：將 `/` route 重新指回大盤頁，移除首頁 route/component，並恢復 TopBar 與 agent context 命名。

## Open Questions

- 第一版首頁是否需要同時抓 TSE 與 OTC 的 sector-flow/hot-stocks，或先沿用預設 TSE 摘要？
- 是否要在本次變更中重命名 `DashboardComponent` 為 `MarketOverviewComponent`，或只調整 route/context？
