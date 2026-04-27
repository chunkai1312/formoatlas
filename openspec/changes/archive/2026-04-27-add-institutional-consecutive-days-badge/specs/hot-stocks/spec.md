## MODIFIED Requirements

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

## ADDED Requirements

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
