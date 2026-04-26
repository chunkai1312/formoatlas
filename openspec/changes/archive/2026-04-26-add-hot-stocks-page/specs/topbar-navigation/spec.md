## MODIFIED Requirements

### Requirement: TopBar navigation links
應用程式 TopBar SHALL 顯示「大盤籌碼」、「資金流向」與「熱門個股」三個導覽連結，以填色 pill 樣式呈現 active 狀態。

- 「大盤籌碼」連結至 `/`（`routerLink="/"`）
- 「資金流向」連結至 `/sector-flow`（`routerLink="/sector-flow"`）
- 「熱門個股」連結至 `/hot-stocks`（`routerLink="/hot-stocks"`）
- Active 狀態：當前路由匹配時，連結以填色 pill 高亮顯示
- 非 active 狀態：連結以半透明樣式顯示
- 導覽連結位置：在 `.spacer` 之前，LOGO 與標題之後

#### Scenario: Active link on dashboard page
- **WHEN** user is on `/` route
- **THEN** 「大盤籌碼」連結顯示填色 pill（active 樣式），「資金流向」與「熱門個股」顯示非 active 樣式

#### Scenario: Active link on sector-flow page
- **WHEN** user is on `/sector-flow` route
- **THEN** 「資金流向」連結顯示填色 pill（active 樣式），「大盤籌碼」與「熱門個股」顯示非 active 樣式

#### Scenario: Active link on hot-stocks page
- **WHEN** user is on `/hot-stocks` route
- **THEN** 「熱門個股」連結顯示填色 pill（active 樣式），「大盤籌碼」與「資金流向」顯示非 active 樣式

#### Scenario: Navigation between pages
- **WHEN** user clicks 「熱門個股」
- **THEN** 應用程式導向 `/hot-stocks` 且 active 狀態即時更新

### Requirement: Sector flow page route
應用程式 SHALL 在 `/sector-flow` 路徑提供資金流向頁面，以 lazy-load 方式載入 `SectorFlowComponent`。

#### Scenario: Navigate to sector-flow
- **WHEN** user navigates to `/sector-flow`
- **THEN** `SectorFlowComponent` 成功載入並渲染

## ADDED Requirements

### Requirement: Hot stocks page route
應用程式 SHALL 在 `/hot-stocks` 路徑提供熱門個股頁面，以 lazy-load 方式載入熱門個股頁面 component。

#### Scenario: Navigate to hot-stocks
- **WHEN** user navigates to `/hot-stocks`
- **THEN** 熱門個股頁面 component 成功載入並渲染
