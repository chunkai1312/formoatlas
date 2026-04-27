## MODIFIED Requirements

### Requirement: TopBar navigation links
應用程式 TopBar SHALL 顯示 `FormoAtlas` 產品名稱，LOGO accessibility text SHALL 使用 FormoAtlas identity，且 logo 與產品名稱 SHALL 作為回首頁 `/` 的連結。TopBar SHALL 顯示「大盤總覽」、「資金流向」與「熱門個股」三個功能導覽連結，以填色 pill 樣式呈現 active 狀態。

- 產品名稱顯示為 `FormoAtlas`
- LOGO alt text 使用 `FormoAtlas logo`
- LOGO 與產品名稱連結至 `/`
- 「大盤總覽」連結至 `/market-overview`（`routerLink="/market-overview"`）
- 「資金流向」連結至 `/sector-flow`（`routerLink="/sector-flow"`）
- 「熱門個股」連結至 `/hot-stocks`（`routerLink="/hot-stocks"`）
- Active 狀態：當前路由匹配功能頁時，對應連結以填色 pill 高亮顯示
- 非 active 狀態：連結以半透明樣式顯示
- 導覽連結位置：在 `.spacer` 之前，LOGO 與標題之後

#### Scenario: Brand link returns to home
- **WHEN** user clicks the TopBar logo or `FormoAtlas` product name
- **THEN** 應用程式 SHALL 導向 `/`

#### Scenario: Active link on market-overview page
- **WHEN** user is on `/market-overview` route
- **THEN** TopBar 顯示 `FormoAtlas` 產品名稱，且「大盤總覽」連結顯示填色 pill（active 樣式），「資金流向」與「熱門個股」顯示非 active 樣式

#### Scenario: No function nav active on home page
- **WHEN** user is on `/` route
- **THEN** TopBar SHALL NOT 將「大盤總覽」、「資金流向」或「熱門個股」顯示為 active

#### Scenario: Active link on sector-flow page
- **WHEN** user is on `/sector-flow` route
- **THEN** TopBar 顯示 `FormoAtlas` 產品名稱，且「資金流向」連結顯示填色 pill（active 樣式），「大盤總覽」與「熱門個股」顯示非 active 樣式

#### Scenario: Active link on hot-stocks page
- **WHEN** user is on `/hot-stocks` route
- **THEN** TopBar 顯示 `FormoAtlas` 產品名稱，且「熱門個股」連結顯示填色 pill（active 樣式），「大盤總覽」與「資金流向」顯示非 active 樣式

#### Scenario: Navigation between pages
- **WHEN** user clicks 「熱門個股」
- **THEN** 應用程式導向 `/hot-stocks` 且 active 狀態即時更新

#### Scenario: Logo accessibility text
- **WHEN** a screen reader encounters the TopBar logo
- **THEN** the logo image SHALL expose `FormoAtlas logo` as its alternative text

### Requirement: Sector flow page route
應用程式 SHALL 在 `/sector-flow` 路徑提供資金流向頁面，以 lazy-load 方式載入 `SectorFlowComponent`。

#### Scenario: Navigate to sector-flow
- **WHEN** user navigates to `/sector-flow`
- **THEN** `SectorFlowComponent` 成功載入並渲染

### Requirement: Hot stocks page route
應用程式 SHALL 在 `/hot-stocks` 路徑提供熱門個股頁面，以 lazy-load 方式載入熱門個股頁面 component。

#### Scenario: Navigate to hot-stocks
- **WHEN** user navigates to `/hot-stocks`
- **THEN** 熱門個股頁面 component 成功載入並渲染

## ADDED Requirements

### Requirement: Market overview page route
應用程式 SHALL 在 `/market-overview` 路徑提供大盤總覽頁面，以 lazy-load 方式載入既有大盤總覽內容。

#### Scenario: Navigate to market-overview
- **WHEN** user navigates to `/market-overview`
- **THEN** 大盤總覽頁面 SHALL 成功載入並渲染晴雨表、大盤走勢、今日籌碼速覽與籌碼指標趨勢
