## Purpose

定義法人（外資 `fini`、投信 `sitc`）連續買賣超天數的計算規則、資料結構，與 migration 行為。

## Requirements

### Requirement: Consecutive days field in InstitutionalTrade
`InstitutionalTrade` 結構 SHALL 包含 `consecutiveDays` 欄位，以整數表示法人連續方向天數：正值代表連買天數，負值代表連賣天數，0 代表無方向（net = 0）。

`Ticker.instInvestors.fini` 與 `Ticker.instInvestors.sitc` SHALL 各自維護獨立的 `consecutiveDays`，不共用計算。

#### Scenario: Consecutive buy increments
- **WHEN** a ticker's `fini.net > 0` on the current date and `fini.consecutiveDays > 0` on the previous trading date
- **THEN** `fini.consecutiveDays` is set to `previousConsecutiveDays + 1`

#### Scenario: New buy streak starts
- **WHEN** a ticker's `fini.net > 0` on the current date and `fini.consecutiveDays <= 0` on the previous trading date (or no previous record)
- **THEN** `fini.consecutiveDays` is set to `1`

#### Scenario: Consecutive sell increments
- **WHEN** a ticker's `fini.net < 0` on the current date and `fini.consecutiveDays < 0` on the previous trading date
- **THEN** `fini.consecutiveDays` is set to `previousConsecutiveDays - 1`

#### Scenario: New sell streak starts
- **WHEN** a ticker's `fini.net < 0` on the current date and `fini.consecutiveDays >= 0` on the previous trading date (or no previous record)
- **THEN** `fini.consecutiveDays` is set to `-1`

#### Scenario: Net zero resets streak
- **WHEN** a ticker's `fini.net = 0` on the current date
- **THEN** `fini.consecutiveDays` is set to `0` regardless of previous value

#### Scenario: Same rules apply to sitc
- **WHEN** any of the above conditions apply with `sitc.net`
- **THEN** `sitc.consecutiveDays` follows the same calculation rules independently of `fini`

### Requirement: Ingestion writes consecutiveDays
每日 TSE 與 OTC 個股法人進出更新（`updateTwseEquitiesInstInvestorsTrades`、`updateTpexEquitiesInstInvestorsTrades`）SHALL 在計算當日 `fini.net` 與 `sitc.net` 後，查詢前一交易日同 symbol 的 `consecutiveDays` 並依規則計算新值，寫入當日 `Ticker` 文件。

查詢前一交易日使用 `{ date: { $lt: currentDate }, symbol }` 搭配 `sort({ date: -1 })` 取最近一筆。

#### Scenario: Ingestion calculates and persists consecutiveDays
- **WHEN** daily institutional trade update runs for a given date
- **THEN** each updated `Ticker` document has `instInvestors.fini.consecutiveDays` and `instInvestors.sitc.consecutiveDays` set according to the calculation rules

#### Scenario: No previous record treated as zero
- **WHEN** no previous `Ticker` document exists for a given symbol
- **THEN** ingestion treats previous `consecutiveDays` as `0` and calculates from the current `net` value only

### Requirement: Migration backfills consecutiveDays
系統 SHALL 提供 migration script，依日期升冪掃描所有有 `instInvestors` 的 `Ticker` 文件，逐日補算並寫入 `fini.consecutiveDays` 與 `sitc.consecutiveDays`。

Migration SHALL 依 `(market, symbol, date)` 分組，確保每個 symbol 的計算順序正確。

#### Scenario: Migration fills historical data
- **WHEN** migration script runs on a database with existing `Ticker` documents lacking `consecutiveDays`
- **THEN** all `Ticker` documents with `instInvestors` have `fini.consecutiveDays` and `sitc.consecutiveDays` populated

#### Scenario: Migration is idempotent
- **WHEN** migration script runs twice on the same database
- **THEN** results are identical with no duplicate writes or errors
