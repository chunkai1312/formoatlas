## MODIFIED Requirements

### Requirement: Sector ranking table
產業資金流向頁面（Section 1：「產業資金流向」）SHALL 顯示 TSE 所有上市產業的資金流向排行表，欄位包含：產業 | 指數 | 漲跌 | 漲跌幅% | 漲跌幅圖 | 成交金額(億) | 昨日金額(億) | 金額差(億) | 比重% | 昨日比重% | 比重差。

Section 1 SHALL 在排行表上方顯示成交比重分佈圖，用於摘要當日主要產業的成交比重集中狀態。排行表仍為完整資料與排序操作的主要區域。

- 分佈圖依 `tradeWeight` 降冪顯示最多 10 筆產業
- 分佈圖每列 SHALL 顯示產業名稱、成交比重與成交比重變化
- 分佈圖長條 SHALL 使用 `tradeWeight` 呈現相對大小
- 分佈圖列點擊 SHALL 更新 `selectedSymbol`、`selectedName` 與 `klineSymbol`
- 分佈圖 SHALL 使用 hover/focus 樣式提示可互動，但 MUST NOT 顯示持久 active row 狀態
- 預設排序：漲跌幅（`changePercent`）降冪
- 使用者可點擊可排序的欄位標題切換排序欄位與方向（`changePercent`、`tradeValue`、`tradeValuePrev`、`tradeValueChange`、`tradeWeight`、`tradeWeightPrev`、`tradeWeightChange`）
- 排行表為純展示，**無列點選行為**，不負責選取產業
- 「指數」欄位（closePrice）跟隨 `change` 方向顯示顏色（正紅負綠）
- 「漲跌幅圖」欄：以左（跌）右（漲）對稱 bar 圖視覺化漲跌幅，寬度比例 = `|changePercent| / maxAbsChange * 100%`

**頁面載入時的自動選取：**
每次日期變更或初始載入取得資料後，系統自動將 `selectedSymbol`、`selectedName`、`klineSymbol` 更新為當前排序 `changePercent` 降冪後的第 1 筆產業（不論使用者是否已手動選取）。

#### Scenario: Page load default state
- **WHEN** user navigates to `/sector-flow`
- **THEN** 排行表顯示所有 TSE 產業，依漲跌幅降冪排序
- **AND** 成交比重分佈圖顯示 `tradeWeight` 前 10 名產業或所有可用產業

#### Scenario: Auto-select top changePercent on load
- **WHEN** sector-flow data loads (initial or date change)
- **THEN** `selectedSymbol` 自動設為漲跌幅最高的產業，Section 2 與 Section 3 顯示該產業的圖表

#### Scenario: Sort by column
- **WHEN** user clicks a column header (e.g., 漲跌幅)
- **THEN** table re-sorts by that column descending; clicking again toggles to ascending
- **AND** 成交比重分佈圖仍依 `tradeWeight` 降冪呈現，不受表格排序影響

#### Scenario: Color coding for 指數 column
- **WHEN** a sector's `change > 0`
- **THEN** 指數欄位顯示紅色
- **WHEN** a sector's `change < 0`
- **THEN** 指數欄位顯示綠色

#### Scenario: Select sector from trade weight distribution
- **WHEN** user clicks a sector row in the trade weight distribution chart
- **THEN** `selectedSymbol` and `selectedName` SHALL update to the clicked sector
- **AND** `klineSymbol` SHALL update to the clicked sector
- **AND** Section 2 資金流向明細 and Section 3 產業類股走勢 SHALL render the clicked sector
- **AND** the clicked sector row MUST NOT remain visually marked as an active row
