## Purpose
Define the stock detail page behavior, layout, navigation entry points, assistant context, and stock-specific market data presentation.
## Requirements
### Requirement: Stock detail route
web app SHALL provide a stock detail page at `/stocks/:symbol`.

The page SHALL load the stock summary aggregate API using the route `symbol` and the global selected date.

The page SHALL set research assistant context to include `route: stock-detail`, the stock `symbol`, and the resolved `market` when summary data is available.

#### Scenario: Navigate to stock detail page
- **WHEN** user navigates to `/stocks/2330`
- **THEN** web app loads stock summary for symbol `2330` and the current global selected date

#### Scenario: Date changes on stock detail page
- **WHEN** user changes the global selected date while viewing `/stocks/2330`
- **THEN** web app reloads stock summary for `2330` and the new selected date

#### Scenario: Stock assistant context is set
- **WHEN** stock summary loads successfully
- **THEN** web app sets assistant context with `route: stock-detail`, resolved `market`, and `symbol`

### Requirement: Stock detail page layout
Stock detail page SHALL present the stock as a盤後研究脈絡頁 with sections for header, chart, institutional summary, market context, and assistant shortcuts.

The header SHALL display stock name, symbol, market label, industry name when available, response date, close price, change, change percent, and watch-list action.

The chart section SHALL display the returned OHLC series with existing台股紅漲綠跌 semantics.

The institutional section SHALL display foreign, investment trust, and dealer net values, plus foreign and investment trust consecutive-day indicators when available.

The market context section SHALL display whether the stock appears in hot-stock rankings and any available sector/trade-value context.

#### Scenario: Render complete stock summary
- **WHEN** stock summary returns quote, OHLC, institutional, and context data
- **THEN** stock detail page renders all primary sections with values from the summary response

#### Scenario: Render missing optional context
- **WHEN** summary response has null industry, null institutional fields, or empty hot-stock context
- **THEN** stock detail page renders stable empty or unavailable states
- **AND** page does not fail rendering

#### Scenario: Render fallback data date
- **WHEN** summary `date` differs from `requestedDate`
- **THEN** stock detail page indicates the actual data date being displayed

### Requirement: Stock detail watch-list integration
Stock detail page SHALL support the existing watch-list add/remove behavior for authenticated users.

When user is not authenticated and attempts to use the watch-list action, web app SHALL show the existing login-required prompt and SHALL NOT call watch-list mutation APIs.

#### Scenario: Add stock to watch list from stock detail
- **WHEN** authenticated user clicks add-to-watch-list on stock detail page
- **THEN** web app calls the existing watch-list add API for the current symbol
- **AND** updates the watch-list action state from the API response

#### Scenario: Remove stock from watch list from stock detail
- **WHEN** authenticated user clicks remove-from-watch-list on stock detail page
- **THEN** web app calls the existing watch-list remove API for the current symbol
- **AND** updates the watch-list action state from the API response

#### Scenario: Unauthenticated stock watch-list action
- **WHEN** unauthenticated user clicks the watch-list action
- **THEN** web app displays the shared login-required prompt
- **AND** does not call watch-list mutation APIs

### Requirement: Stock assistant shortcuts
Stock detail page SHALL provide stock-mode assistant shortcut prompts.

Shortcut prompts SHALL open or focus the existing assistant panel, set assistant mode to `stock`, and populate or submit a stock-specific question using the current stock context.

Shortcut prompt wording SHALL avoid target prices, explicit buy/sell instructions, or guaranteed outcomes.

#### Scenario: Use stock analysis shortcut
- **WHEN** user activates a stock assistant shortcut on `/stocks/2330`
- **THEN** assistant uses `mode: stock`
- **AND** assistant request context includes `route: stock-detail`, `symbol: 2330`, and resolved `market`

#### Scenario: Stock shortcut wording
- **WHEN** stock assistant shortcuts are rendered
- **THEN** shortcut labels focus on量價、法人、市場脈絡、風險檢查, or追蹤指標
- **AND** shortcut labels do not present buy/sell advice

### Requirement: Symbol navigation entry points
web app SHALL make symbol-bearing surfaces navigate to stock detail pages while preserving their existing primary workflows.

Hot stocks ranking rows, market map stock nodes, and watch-list rows SHALL provide a navigable path to `/stocks/:symbol`.

Existing controls such as watch-list toggle buttons SHALL remain usable without unintentionally navigating to the stock page.

#### Scenario: Navigate from hot stocks row
- **WHEN** user activates the symbol or stock-name link in a hot-stocks row
- **THEN** web app navigates to `/stocks/<symbol>` with current date context preserved by global state

#### Scenario: Navigate from watch list row
- **WHEN** user activates a watch-list row stock link
- **THEN** web app navigates to `/stocks/<symbol>`

#### Scenario: Preserve row controls
- **WHEN** user activates a watch-list toggle or remove control in a symbol-bearing row
- **THEN** web app performs that control action
- **AND** does not navigate to the stock detail page as a side effect

### Requirement: K 線圖價格基準切換
Stock detail page SHALL provide a price basis toggle for the K-line chart allowing the user to switch between raw（原始）and adjusted（還原）OHLC.

The toggle SHALL default to adjusted（還原）as the stable displayed basis on initial page load.

The chart SHALL preserve 台股紅漲綠跌 semantics regardless of the selected price basis.

When the user switches price basis, the chart SHALL reload the OHLC series using the appropriate `adjusted` parameter on the ticker OHLC API and re-render without navigating away.

#### Scenario: 預設顯示還原 K 線
- **WHEN** user navigates to a stock detail page
- **THEN** K-line chart displays backward-adjusted OHLC（還原價）
- **AND** price basis toggle shows 還原 as the active selection

#### Scenario: 切換至原始 K 線
- **WHEN** user activates the 原始 option in the price basis toggle
- **THEN** K-line chart reloads and displays raw OHLC
- **AND** 台股紅漲綠跌 semantics are preserved

#### Scenario: 切換至還原 K 線
- **WHEN** user activates the 還原 option in the price basis toggle
- **THEN** K-line chart reloads and displays backward-adjusted OHLC
- **AND** 台股紅漲綠跌 semantics are preserved

#### Scenario: 指數 symbol 的價格基準切換
- **WHEN** user views a stock detail page for an index symbol
- **THEN** K-line chart displays raw OHLC（指數不支援還原）
- **AND** price basis toggle is hidden or disabled

### Requirement: Stock detail page presents margin trading context
Stock detail page SHALL present per-stock margin trading context when `stock-summary.marginTrading` is available.

The margin trading section SHALL include:
- margin balance and margin balance change
- short balance and short balance change
- margin buy and sell activity
- short sell and buy activity
- offset
- margin trading note when present

#### Scenario: Render margin trading metrics
- **WHEN** stock summary contains `marginTrading`
- **THEN** the stock detail page displays margin and short balance metrics
- **AND** the page displays financing and short activity metrics

#### Scenario: Render margin trading note
- **WHEN** stock summary `marginTrading.note` is a non-empty string
- **THEN** the stock detail page displays the note near the margin trading metrics

#### Scenario: Margin trading data unavailable
- **WHEN** stock summary `marginTrading` is `null`
- **THEN** the stock detail page still renders the stock summary
- **AND** the page presents a neutral empty state for margin trading context

### Requirement: Stock detail page presents institutional trading detail rows
Stock detail page SHALL present row-level institutional trading details when `stock-summary.institutional.details` is available.

The institutional detail view SHALL display:
- investor label
- buy value when available
- sell value when available
- net value

#### Scenario: Render institutional detail rows
- **WHEN** stock summary contains one or more `institutional.details` rows
- **THEN** the stock detail page displays those rows in the institutional section
- **AND** each row includes investor label and net value

#### Scenario: Render unavailable buy or sell values
- **WHEN** an institutional detail row has `buy: null` or `sell: null`
- **THEN** the stock detail page displays a neutral placeholder for that unavailable value
- **AND** the page still displays the row's net value

#### Scenario: Legacy stock summary without institutional details
- **WHEN** stock summary `institutional.details` is empty
- **THEN** the stock detail page keeps existing institutional summary metrics visible when available
- **AND** the detail view presents a neutral empty state without failing

