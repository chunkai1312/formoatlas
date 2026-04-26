## MODIFIED Requirements

### Requirement: TopBar navigation links
應用程式 TopBar SHALL 顯示 `FormoAtlas` 產品名稱，LOGO accessibility text SHALL 使用 FormoAtlas identity，並顯示「大盤籌碼」、「資金流向」與「熱門個股」三個導覽連結，以填色 pill 樣式呈現 active 狀態。

- 產品名稱顯示為 `FormoAtlas`
- LOGO alt text 使用 `FormoAtlas logo`
- 「大盤籌碼」連結至 `/`（`routerLink="/"`）
- 「資金流向」連結至 `/sector-flow`（`routerLink="/sector-flow"`）
- 「熱門個股」連結至 `/hot-stocks`（`routerLink="/hot-stocks"`）
- Active 狀態：當前路由匹配時，連結以填色 pill 高亮顯示
- 非 active 狀態：連結以半透明樣式顯示
- 導覽連結位置：在 `.spacer` 之前，LOGO 與標題之後

#### Scenario: Active link on dashboard page
- **WHEN** user is on `/` route
- **THEN** TopBar 顯示 `FormoAtlas` 產品名稱，且「大盤籌碼」連結顯示填色 pill（active 樣式），「資金流向」與「熱門個股」顯示非 active 樣式

#### Scenario: Active link on sector-flow page
- **WHEN** user is on `/sector-flow` route
- **THEN** TopBar 顯示 `FormoAtlas` 產品名稱，且「資金流向」連結顯示填色 pill（active 樣式），「大盤籌碼」與「熱門個股」顯示非 active 樣式

#### Scenario: Active link on hot-stocks page
- **WHEN** user is on `/hot-stocks` route
- **THEN** TopBar 顯示 `FormoAtlas` 產品名稱，且「熱門個股」連結顯示填色 pill（active 樣式），「大盤籌碼」與「資金流向」顯示非 active 樣式

#### Scenario: Navigation between pages
- **WHEN** user clicks 「熱門個股」
- **THEN** 應用程式導向 `/hot-stocks` 且 active 狀態即時更新

#### Scenario: Logo accessibility text
- **WHEN** a screen reader encounters the TopBar logo
- **THEN** the logo image SHALL expose `FormoAtlas logo` as its alternative text
