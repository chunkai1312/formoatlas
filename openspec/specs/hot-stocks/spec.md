## Purpose

定義熱門個股 API 與頁面需求，涵蓋上市／上櫃切換、多組個股排行、回傳欄位、排序、空資料行為、上櫃權證資料排除與排行表顯示格式。

## Requirements

### Requirement: Hot stocks aggregate endpoint
系統 SHALL 提供 `GET /marketdata/hot-stocks?date=YYYY-MM-DD&market=TSE|OTC` endpoint，一次回傳指定市場與日期的熱門個股排行集合。

若 `date` 未指定，預設使用當日日期（`DateTime.local().toISODate()`）。

若 `market` 未指定，系統 SHALL 使用 `TSE`。

若指定日期沒有交易資料，系統 SHALL 使用最近一個小於等於指定日期且有個股資料的交易日。

系統 SHALL 在每日更新上櫃個股收盤行情與法人進出資料時排除上櫃權證，避免權證資料寫入 `Ticker` collection。權證代號判斷規則 SHALL 覆蓋 `7[0-3]` 開頭的六碼純數字權證，以及 `7[0-3]` 開頭、後綴為 `P`、`F`、`Q`、`C`、`B`、`X`、`Y`、`U` 的六碼權證。

系統 SHALL 提供 migration script 移除既有已入庫的上櫃權證資料。

熱門個股 API SHALL 依 `Ticker` collection 中已清理的個股資料產生排行；API 查詢層不另行套用權證 symbol filter。

Response SHALL 包含：
- `date`：實際回傳資料日期
- `market`：`TSE` 或 `OTC`
- `movers.gainers`：漲幅排行
- `movers.losers`：跌幅排行
- `actives.byVolume`：成交量排行
- `actives.byValue`：成交值排行
- `institutional.finiBuy`：外資買超排行
- `institutional.finiSell`：外資賣超排行
- `institutional.sitcBuy`：投信買超排行
- `institutional.sitcSell`：投信賣超排行

每個排行陣列 SHALL 最多回傳 20 筆。

#### Scenario: Query TSE hot stocks
- **WHEN** client sends `GET /marketdata/hot-stocks?date=2026-03-13&market=TSE`
- **THEN** system returns HTTP 200 with TSE hot stock rankings for the latest available trading date on or before `2026-03-13`

#### Scenario: Query OTC hot stocks
- **WHEN** client sends `GET /marketdata/hot-stocks?date=2026-03-13&market=OTC`
- **THEN** system returns HTTP 200 with OTC hot stock rankings for the latest available trading date on or before `2026-03-13`

#### Scenario: OTC warrant quote update is skipped
- **WHEN** daily TPEx equity quote update receives a warrant symbol matching the OTC warrant pattern
- **THEN** system does not upsert that ticker document

#### Scenario: OTC warrant institutional update is skipped
- **WHEN** daily TPEx institutional trade update receives a warrant symbol matching the OTC warrant pattern
- **THEN** system does not upsert that ticker document

#### Scenario: OTC warrant migration removes existing data
- **WHEN** the OTC warrant migration script runs
- **THEN** existing `Ticker` documents with `type=EQUITY`, `market=OTC`, and warrant-like symbols are deleted

#### Scenario: Hot stocks query uses cleaned data
- **WHEN** client sends `GET /marketdata/hot-stocks?date=2026-03-13&market=OTC`
- **THEN** system builds rankings from existing OTC equity records without applying an additional query-layer warrant filter

#### Scenario: Default query parameters
- **WHEN** client sends `GET /marketdata/hot-stocks`
- **THEN** system uses today's date and `TSE` market

#### Scenario: No records available
- **WHEN** no equity records exist on or before the requested date for the requested market
- **THEN** system returns HTTP 200 with every ranking field as an empty array

### Requirement: Hot stock ranking row fields
每個熱門個股排行 row SHALL 使用一致資料結構，讓前端可用同一個 row model 呈現不同排行。

Row SHALL 包含：
- `symbol`：股票代號
- `name`：股票名稱
- `date`：資料日期
- `market`：`TSE` 或 `OTC`
- `closePrice`：收盤價
- `change`：漲跌
- `changePercent`：漲跌幅（%）
- `tradeVolume`：成交量
- `tradeValue`：成交值
- `finiNet`：外資買賣超
- `sitcNet`：投信買賣超
- `finiConsecutiveDays`：外資連續買賣超天數（正值 = 連買、負值 = 連賣、0 = 無）
- `sitcConsecutiveDays`：投信連續買賣超天數（正值 = 連買、負值 = 連賣、0 = 無）

若法人資料尚未寫入，`finiNet`、`sitcNet`、`finiConsecutiveDays` 或 `sitcConsecutiveDays` SHALL 以 `0` 或 `null` 穩定回傳，不得造成 API 失敗。

#### Scenario: Ranking row structure
- **WHEN** any ranking array contains a stock row
- **THEN** the row includes the common fields needed by all hot stock tables

#### Scenario: Missing institutional fields
- **WHEN** a stock has quote data but missing institutional trade data
- **THEN** system still returns the stock row without throwing an error

#### Scenario: Consecutive days fields included in response
- **WHEN** a stock row has `instInvestors.fini.consecutiveDays` in the database
- **THEN** `finiConsecutiveDays` is projected in the API response with its value
- **AND** `sitcConsecutiveDays` is projected in the API response with its value

### Requirement: Hot stocks market switcher
熱門個股頁面 SHALL 在頁面頂部顯示「上市」/「上櫃」兩個 Tab，切換後重新載入所有熱門個股排行。

- 初始狀態：「上市（TSE）」Tab 為 active
- Tab UI SHALL 採用與資金流向頁一致的 active class 模式
- 切換市場 SHALL 保留目前全域日期

#### Scenario: Initial market state
- **WHEN** user navigates to `/hot-stocks`
- **THEN** 「上市」Tab is active and TSE rankings are loaded

#### Scenario: Switch to OTC market
- **WHEN** user clicks 「上櫃」Tab
- **THEN** all ranking sections reload with OTC rankings for the selected date

#### Scenario: Switch back to TSE market
- **WHEN** user clicks 「上市」Tab after viewing OTC
- **THEN** all ranking sections reload with TSE rankings for the selected date

### Requirement: Hot stocks ranking overview
熱門個股頁面 SHALL 以 overview 方式呈現多組排行，包含「漲跌幅排行」、「成交量值排行」、「外資買賣超排行」、「投信買賣超排行」。

「漲跌幅排行」SHALL 顯示漲幅榜與跌幅榜。

「成交量值排行」SHALL 顯示成交量排行與成交值排行。

「外資買賣超排行」SHALL 顯示外資買超與外資賣超。

「投信買賣超排行」SHALL 顯示投信買超與投信賣超。

第一版熱門個股頁 SHALL 不提供列點選聯動、個股 K 線圖或個股詳情面板。

#### Scenario: Render all overview sections
- **WHEN** hot stocks data loads successfully
- **THEN** page renders all four ranking sections with their corresponding buy/sell or up/down sub-rankings

#### Scenario: Date changes
- **WHEN** user changes the global selected date from the toolbar
- **THEN** hot stocks page reloads all rankings for the new date and current market

#### Scenario: Empty ranking data
- **WHEN** a ranking array is empty
- **THEN** page renders an empty state for that ranking without hiding the rest of the page

### Requirement: Hot stocks rank table formatting
熱門個股排行表 SHALL 使用適合掃描的密集表格呈現，並依排行類型顯示相關欄位。

所有排行表 SHALL 顯示股票代號、股票名稱、收盤價、漲跌、漲跌幅。

成交量排行 SHALL 顯示成交量，單位為「張」。

成交值排行 SHALL 顯示成交值，並以「億」格式化。

外資買賣超排行 SHALL 顯示外資買賣超，單位為「張」。

投信買賣超排行 SHALL 顯示投信買賣超，單位為「張」。

正向數值 SHALL 使用紅色語意，負向數值 SHALL 使用綠色語意，沿用既有台股配色。

#### Scenario: Common columns
- **WHEN** a ranking table renders rows
- **THEN** each row displays symbol, name, close price, change, and change percent

#### Scenario: Trade value formatting
- **WHEN** a trade value ranking row renders
- **THEN** trade value is displayed in 億 units

#### Scenario: Share-based metric formatting
- **WHEN** a trade volume, foreign net, or investment trust net row renders
- **THEN** the metric is displayed in 張 units

#### Scenario: Positive and negative coloring
- **WHEN** a row has positive change or positive net buy
- **THEN** the value is styled with positive red semantics
- **WHEN** a row has negative change or negative net buy
- **THEN** the value is styled with negative green semantics

### Requirement: Institutional consecutive days badge in hot stocks rankings
外資買超排行、外資賣超排行、投信買超排行、投信賣超排行 SHALL 在每個股票名稱右側依 `finiConsecutiveDays` / `sitcConsecutiveDays` 顯示對應 badge：

**主要 badge（連續天數）：**

| 值 | Badge 文字 | 視覺樣式 |
|---|---|---|
| `≥ +2` | 連 n 買 | 紅色 outline |
| `≤ -2` | 連 n 賣 | 綠色 outline |
| `+1` / `-1` / `0` / `null` | 無 badge | — |

外資排行使用 `finiConsecutiveDays`；投信排行使用 `sitcConsecutiveDays`。

**副 badge（對向機構同向）：**

外資排行同時顯示投信方向，投信排行同時顯示外資方向。
當兩機構方向相同（net 同號）時，顯示副 badge（淡色 outline）；反向時不顯示，以沉默表達。

| 條件 | 副 badge 文字 | 視覺樣式 |
|---|---|---|
| 外資買超榜，且 `sitcNet > 0` | `投信買` | 淡紅 outline（小字） |
| 外資賣超榜，且 `sitcNet < 0` | `投信賣` | 淡綠 outline（小字） |
| 投信買超榜，且 `finiNet > 0` | `外資買` | 淡紅 outline（小字） |
| 投信賣超榜，且 `finiNet < 0` | `外資賣` | 淡綠 outline（小字） |
| 反向或無資料 | 無 badge | — |

Badge SHALL 放在股票名稱右側，不新增獨立表格欄位。

漲跌幅排行、成交量值排行 SHALL NOT 顯示此 badge。

#### Scenario: Consecutive buy badge shown in fini buy ranking
- **WHEN** a row in the 外資買超 ranking has `finiConsecutiveDays >= 2`
- **THEN** an outline red badge showing「連 n 買」is displayed next to the stock name

#### Scenario: Consecutive sell badge shown in fini sell ranking
- **WHEN** a row in the 外資賣超 ranking has `finiConsecutiveDays <= -2`
- **THEN** an outline green badge showing「連 n 賣」is displayed next to the stock name

#### Scenario: No badge when consecutiveDays is -1, 0, 1, or null
- **WHEN** a row has `finiConsecutiveDays` in `{-1, 0, 1}` or `null`
- **THEN** no primary badge is displayed next to the stock name

#### Scenario: Sitc ranking uses sitcConsecutiveDays
- **WHEN** a row in the 投信買超 or 投信賣超 ranking renders
- **THEN** primary badge is derived from `sitcConsecutiveDays` (not `finiConsecutiveDays`)

#### Scenario: Secondary badge shown when institutions align in buy direction
- **WHEN** a row in the 外資買超 ranking has `sitcNet > 0`
- **THEN** a faded red outline badge showing「投信買」is displayed after the primary badge

#### Scenario: Secondary badge shown when institutions align in sell direction
- **WHEN** a row in the 外資賣超 ranking has `sitcNet < 0`
- **THEN** a faded green outline badge showing「投信賣」is displayed after the primary badge

#### Scenario: No secondary badge when institutions diverge
- **WHEN** primary institution is net buying but secondary institution is net selling (or zero)
- **THEN** no secondary badge is displayed

#### Scenario: Movers and actives rankings show no badge
- **WHEN** a row renders in 漲幅榜, 跌幅榜, 成交量排行, or 成交值排行
- **THEN** no badge of any kind is shown
