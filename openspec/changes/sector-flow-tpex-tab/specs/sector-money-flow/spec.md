## ADDED Requirements

### Requirement: Market switcher tab (上市 / 上櫃)
資金流向頁面頂部 SHALL 顯示「上市」/ 「上櫃」兩個 Tab，切換後排行表、資金流向明細圖、K 線圖三個 section 聯動更新，顯示對應市場的資料。

- 初始狀態：「上市（TSE）」Tab 為 active
- Tab 切換後：重新載入對應市場資料，並自動選取 `changePercent` 最高的產業（重置 selectedSymbol、selectedName、klineSymbol）
- Tab UI 採 CSS class active 切換，不依賴 Angular Material Tabs

#### Scenario: Initial state
- **WHEN** user navigates to `/sector-flow`
- **THEN** 「上市」Tab 為 active，排行表顯示 TSE 產業

#### Scenario: Switch to OTC tab
- **WHEN** user clicks 「上櫃」Tab
- **THEN** 排行表更新為 OTC 23 個產業，Section 2 資金流向圖及 Section 3 K 線圖更新為 changePercent 最高的 OTC 產業

#### Scenario: Switch back to TSE tab
- **WHEN** user clicks 「上市」Tab after viewing OTC
- **THEN** 排行表恢復 TSE 產業，Section 2 與 Section 3 更新為 changePercent 最高的 TSE 產業

### Requirement: Dynamic benchmark index in money flow chart
Section 2 資金流向明細圖（上下雙子圖）SHALL 依當前 activeMarket 動態切換基準指數：
- `activeMarket === 'TSE'`：基準指數為 IX0001（加權指數），左 Y 軸標籤顯示「加權指數」
- `activeMarket === 'OTC'`：基準指數為 IX0043（櫃買指數），左 Y 軸標籤顯示「櫃買指數」

#### Scenario: TSE mode benchmark
- **WHEN** activeMarket is 'TSE' and user views money flow chart
- **THEN** upper chart left series uses IX0001 data with label「加權指數」

#### Scenario: OTC mode benchmark
- **WHEN** activeMarket is 'OTC' and user views money flow chart
- **THEN** upper chart left series uses IX0043 data with label「櫃買指數」
