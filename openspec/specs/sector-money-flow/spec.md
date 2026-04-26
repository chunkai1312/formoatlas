## Purpose

定義產業資金流向頁在上市／上櫃市場切換、排行表、資金流向明細圖、產業 K 線圖與跨元件狀態共享上的功能需求。

## Requirements

### Requirement: Sector ranking table
產業資金流向頁面（Section 1：「產業資金流向」）SHALL 顯示 TSE 所有上市產業的資金流向排行表，欄位包含：產業 | 指數 | 漲跌 | 漲跌幅% | 漲跌幅圖 | 成交金額(億) | 昨日金額(億) | 金額差(億) | 比重% | 昨日比重% | 比重差。

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

#### Scenario: Auto-select top changePercent on load
- **WHEN** sector-flow data loads (initial or date change)
- **THEN** `selectedSymbol` 自動設為漲跌幅最高的產業，Section 2 與 Section 3 顯示該產業的圖表

#### Scenario: Sort by column
- **WHEN** user clicks a column header (e.g., 漲跌幅)
- **THEN** table re-sorts by that column descending; clicking again toggles to ascending

#### Scenario: Color coding for 指數 column
- **WHEN** a sector's `change > 0`
- **THEN** 指數欄位顯示紅色
- **WHEN** a sector's `change < 0`
- **THEN** 指數欄位顯示綠色

### Requirement: Market switcher tab (上市 / 上櫃)
資金流向頁面頂部 SHALL 顯示「上市」/ 「上櫃」兩個 Tab，切換後排行表、資金流向明細圖、K 線圖三個 section 聯動更新，顯示對應市場的資料。

- 初始狀態：「上市（TSE）」Tab 為 active
- Tab 切換後：重新載入對應市場資料，並自動選取 `changePercent` 最高的產業（重置 `selectedSymbol`、`selectedName`、`klineSymbol`）
- Tab UI 採 CSS class `active` 切換，不依賴 Angular Material Tabs

#### Scenario: Initial state
- **WHEN** user navigates to `/sector-flow`
- **THEN** 「上市」Tab 為 active，排行表顯示 TSE 產業

#### Scenario: Switch to OTC tab
- **WHEN** user clicks 「上櫃」Tab
- **THEN** 排行表更新為 OTC 23 個產業，Section 2 資金流向圖及 Section 3 K 線圖更新為 `changePercent` 最高的 OTC 產業

#### Scenario: Switch back to TSE tab
- **WHEN** user clicks 「上市」Tab after viewing OTC
- **THEN** 排行表恢復 TSE 產業，Section 2 與 Section 3 更新為 `changePercent` 最高的 TSE 產業

### Requirement: Sector money flow chart (上下雙子圖)
Section 2「產業類股趨勢」SHALL 直接（無 tab）以 eCharts 上下雙子圖呈現選取產業的資金流向趨勢，卡片標頭含產業下拉選單與時間範圍按鈕（1M / 3M / 6M）：
- 上半圖（雙 Y 軸折線圖）：左 Y 軸為加權指數（IX0001）收盤點數，右 Y 軸為選取產業指數收盤點數；兩條折線共用 X 軸與 tooltip 垂直指示線
- 下半圖（單 Y 軸折線圖）：Y 軸為選取產業成交比重（%），右側 Y 軸，不顯示軸標籤；X 軸與上半圖對齊
- 所有 Y 軸使用 `scale: true`（非零基線）顯示
- 兩個子圖以 `axisPointer` 連動，滑鼠移動時上下同步顯示 tooltip
- tooltip 自訂 formatter：日期只顯示一次作為標頭，系列依序顯示，「成交比重%」排於最後
- 卡片標頭產業下拉選單（native `<select>`）：選取產業時更新 `selectedSymbol`
- 圖表高度：320px

#### Scenario: Load chart on sector selection (dropdown)
- **WHEN** user selects a sector from the dropdown in the chart card header
- **THEN** 資金流向明細圖更新為該產業 + 加權指數（IX0001）的時間序列

#### Scenario: Time range switch
- **WHEN** user clicks 3M range button
- **THEN** 兩個子圖同步更新為近 3 個月資料

#### Scenario: Tooltip sync between sub-charts
- **WHEN** user hovers over a date on upper chart
- **THEN** lower chart 同步顯示同一日期的成交比重數值，且日期標頭只呈現一次

### Requirement: Dynamic benchmark index in money flow chart
Section 2 資金流向明細圖（上下雙子圖）SHALL 依當前 `activeMarket` 動態切換基準指數：
- `activeMarket === 'TSE'`：基準指數為 `IX0001`（加權指數），左 Y 軸標籤顯示「加權指數」
- `activeMarket === 'OTC'`：基準指數為 `IX0043`（櫃買指數），左 Y 軸標籤顯示「櫃買指數」

#### Scenario: TSE mode benchmark
- **WHEN** `activeMarket` is `TSE` and user views money flow chart
- **THEN** upper chart left series uses `IX0001` data with label「加權指數」

#### Scenario: OTC mode benchmark
- **WHEN** `activeMarket` is `OTC` and user views money flow chart
- **THEN** upper chart left series uses `IX0043` data with label「櫃買指數」

### Requirement: Sector K-line chart（產業類股走勢）
Section 3「產業類股走勢」SHALL 以現有 `KlineChartComponent` 顯示選取產業的 K 線走勢，功能與大盤籌碼頁的 K 線圖相同：日K / 週K 切換、時間範圍選擇（1M / 3M / 6M / 1Y / 2Y）、MA 均線、成交量柱。

- Section 3 使用**獨立的 `klineSymbol` 訊號**（`SectorFlowStateService.klineSymbol`），與 Section 2 的 `selectedSymbol` 分離
- 卡片標題區以 `ng-content select="[cardTitle]"` 投影 native `<select>` 下拉選單（`[value]="s.symbol" [selected]="s.symbol === klineSymbol()"`），供使用者切換顯示產業
- 頁面載入時 `klineSymbol` 與 `selectedSymbol` 同步設為漲跌幅最高產業；使用者可透過 Section 3 的下拉選單獨立切換

#### Scenario: Sector K-line loads on page load
- **WHEN** sector-flow data loads
- **THEN** `KlineChartComponent` 以 `klineSymbol`（預設為漲跌幅最高產業）顯示對應 K 線資料

#### Scenario: Sector K-line dropdown change
- **WHEN** user selects a different sector from Section 3 dropdown
- **THEN** `klineSymbol` 更新，K 線圖重新載入該產業資料，不影響 Section 2 的顯示

#### Scenario: Default symbol on dashboard page unchanged
- **WHEN** user is on the dashboard page (`/`)
- **THEN** `KlineChartComponent` 仍顯示加權指數（IX0001）K 線，行為不受影響

### Requirement: KlineChartComponent symbol input
`KlineChartComponent` SHALL 接受 `symbol` signal input（type: `string`，預設值：`'IX0001'`），以 `input()` 方式宣告，並於資料抓取時使用此 symbol。卡片標題區以 `<ng-content select="[cardTitle]">` 支援投影內容（有預設 fallback：`<span>加權指數 K 線</span>`）。

#### Scenario: Symbol input defaults to TAIEX
- **WHEN** `KlineChartComponent` is used without providing `symbol` input
- **THEN** 元件行為與改動前完全相同，抓取 IX0001 資料

#### Scenario: Symbol input with sector symbol
- **WHEN** `symbol="IX0028"` is passed as input
- **THEN** 元件抓取 IX0028 的 OHLC 資料並渲染 K 線

### Requirement: SectorFlowStateService
`SectorFlowStateService` SHALL 以 Angular `@Injectable()` 提供以下 signals 作為頁面跨元件的狀態共享：

```typescript
readonly selectedSymbol = signal<string>('');       // Section 2 圖表的產業
readonly selectedName   = signal<string>('');       // 顯示名稱
readonly localRange     = signal<TimeRange>('1M');  // Section 2 時間範圍
readonly sectors        = signal<{ symbol: string; name: string }[]>([]); // 下拉選單用
readonly klineSymbol    = signal<string | undefined>(undefined); // Section 3 K 線圖的產業
```

#### Scenario: Signals initialized on data load
- **WHEN** sector-flow data loads
- **THEN** `sectors` 填入所有產業清單，`selectedSymbol`、`selectedName`、`klineSymbol` 設為漲跌幅最高的產業
