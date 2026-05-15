## MODIFIED Requirements

### Requirement: TopBar navigation links
應用程式 TopBar SHALL 顯示 `FormoAtlas` 產品名稱，LOGO accessibility text SHALL 使用 FormoAtlas identity，且 logo 與產品名稱 SHALL 作為回首頁 `/` 的連結。TopBar SHALL 使用 PrimeNG 或應用程式自有導覽控制顯示「大盤總覽」、「資金流向」、「熱門個股」與「自選股」功能導覽入口，以填色 pill 樣式呈現 active 狀態；未登入使用者選擇「自選股」時 SHALL 顯示登入提示，而不是直接呼叫 watch list API。

- 產品名稱顯示為 `FormoAtlas`
- LOGO alt text 使用 `FormoAtlas logo`
- LOGO 與產品名稱連結至 `/`
- 「大盤總覽」連結至 `/market-overview`（`routerLink="/market-overview"`）
- 「資金流向」連結至 `/sector-flow`（`routerLink="/sector-flow"`）
- 「熱門個股」連結至 `/hot-stocks`（`routerLink="/hot-stocks"`）
- 「自選股」入口導向或開啟 `/watchlist`，但未登入使用者 SHALL 先看到登入提示
- Active 狀態：當前路由匹配功能頁時，對應連結以填色 pill 高亮顯示
- 非 active 狀態：連結以半透明樣式顯示
- 導覽連結位置：在 `.spacer` 之前，LOGO 與標題之後
- TopBar date picker、user menu、theme toggle、login/logout controls SHALL use PrimeNG or app-owned controls and SHALL NOT depend on Angular Material directives or components

#### Scenario: Brand link returns to home
- **WHEN** 使用者點選 TopBar logo 或 `FormoAtlas` 產品名稱
- **THEN** 應用程式 SHALL 導向 `/`

#### Scenario: Active link on market-overview page
- **WHEN** 使用者位於 `/market-overview` route
- **THEN** TopBar SHALL 顯示 `FormoAtlas` 產品名稱
- **AND** 「大盤總覽」連結 SHALL 顯示填色 pill active 樣式
- **AND** 「資金流向」、「熱門個股」與「自選股」SHALL 顯示非 active 樣式

#### Scenario: No function nav active on home page
- **WHEN** 使用者位於 `/` route
- **THEN** TopBar SHALL NOT 將「大盤總覽」、「資金流向」、「熱門個股」或「自選股」顯示為 active

#### Scenario: Active link on sector-flow page
- **WHEN** 使用者位於 `/sector-flow` route
- **THEN** TopBar SHALL 顯示 `FormoAtlas` 產品名稱
- **AND** 「資金流向」連結 SHALL 顯示填色 pill active 樣式
- **AND** 「大盤總覽」、「熱門個股」與「自選股」SHALL 顯示非 active 樣式

#### Scenario: Active link on hot-stocks page
- **WHEN** 使用者位於 `/hot-stocks` route
- **THEN** TopBar SHALL 顯示 `FormoAtlas` 產品名稱
- **AND** 「熱門個股」連結 SHALL 顯示填色 pill active 樣式
- **AND** 「大盤總覽」、「資金流向」與「自選股」SHALL 顯示非 active 樣式

#### Scenario: Active link on watchlist page
- **WHEN** 已登入使用者位於 `/watchlist` route
- **THEN** TopBar SHALL 顯示 `FormoAtlas` 產品名稱
- **AND** 「自選股」連結 SHALL 顯示填色 pill active 樣式
- **AND** 其他功能導覽連結 SHALL 顯示非 active 樣式

#### Scenario: Navigation between pages
- **WHEN** 使用者點選「熱門個股」
- **THEN** 應用程式 SHALL 導向 `/hot-stocks`
- **AND** active 狀態 SHALL 即時更新

#### Scenario: Signed-in user opens watchlist from TopBar
- **WHEN** 已登入使用者點選「自選股」
- **THEN** 應用程式 SHALL 導向 `/watchlist`
- **AND** active 狀態 SHALL 即時更新

#### Scenario: Signed-out user opens watchlist from TopBar
- **WHEN** 未登入使用者點選「自選股」
- **THEN** 應用程式 SHALL 顯示登入提示
- **AND** SHALL NOT 在登入前呼叫 watch list API

#### Scenario: Logo accessibility text
- **WHEN** 螢幕閱讀器讀取 TopBar logo
- **THEN** logo image SHALL expose `FormoAtlas logo` as its alternative text

#### Scenario: Date picker remains available
- **WHEN** 使用者開啟 TopBar 日期選擇控制
- **THEN** 系統 SHALL 顯示 PrimeNG 或應用程式自有日期選擇 UI，並 SHALL 在選取日期後更新全域日期狀態

#### Scenario: User menu remains available
- **WHEN** 已登入使用者開啟 TopBar 使用者選單
- **THEN** 系統 SHALL 顯示 PrimeNG 或應用程式自有選單 UI，並 SHALL 保留登出操作
