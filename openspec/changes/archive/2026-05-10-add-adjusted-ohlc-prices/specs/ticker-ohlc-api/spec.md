## MODIFIED Requirements

### Requirement: OHLC 查詢端點
系統 SHALL 提供 `GET /marketdata/tickers` 端點，依 symbol 與日期區間回傳收盤行情資料。

端點 SHALL 接受 optional boolean query parameter `adjusted`。

當 `adjusted` 未提供或不為 `true` 時，系統 SHALL 維持既有原始 OHLC 回傳行為。

當 `adjusted=true` 且 symbol 為可調整的股票或 ETF 時，系統 SHALL 回傳向後還原 OHLC；還原價 SHALL 只調整 `openPrice`、`highPrice`、`lowPrice`、`closePrice`，並 SHALL NOT 調整 `tradeVolume`、`tradeValue` 或 `tradeWeight`。

當 `adjusted=true` 但 symbol 為指數或沒有可用調整事件時，系統 SHALL 回傳原始 OHLC，且 SHALL NOT 回傳錯誤。

#### Scenario: 成功查詢指定 symbol 的 OHLC 資料
- **WHEN** 呼叫 `GET /marketdata/tickers?symbol=IX0001&startDate=2025-09-01&endDate=2026-03-12`
- **THEN** 系統 SHALL 回傳 HTTP 200，body 為陣列，每筆包含 `date`、`openPrice`、`highPrice`、`lowPrice`、`closePrice`、`tradeValue`，並依 `date` 升冪排序

#### Scenario: symbol 為必填
- **WHEN** 呼叫 `GET /marketdata/tickers` 未帶 `symbol`
- **THEN** 系統 SHALL 回傳 HTTP 400

#### Scenario: 日期預設值
- **WHEN** 呼叫 `GET /marketdata/tickers?symbol=IX0001` 未帶日期參數
- **THEN** 系統 SHALL 以當日往前 3 個月為 `startDate`、當日為 `endDate` 查詢

#### Scenario: 查詢還原 OHLC
- **WHEN** 呼叫 `GET /marketdata/tickers?symbol=2330&startDate=2021-01-01&endDate=2026-05-10&adjusted=true`
- **THEN** 系統 SHALL 回傳 HTTP 200
- **AND** 每筆資料 SHALL 維持既有 OHLC response shape
- **AND** 事件日前的 OHLC price fields SHALL 套用所有 applicable event factor 的乘積

#### Scenario: adjusted false 維持原始 OHLC
- **WHEN** 呼叫 `GET /marketdata/tickers?symbol=2330&adjusted=false`
- **THEN** 系統 SHALL 回傳原始 OHLC

#### Scenario: 指數忽略 adjusted
- **WHEN** 呼叫 `GET /marketdata/tickers?symbol=IX0001&adjusted=true`
- **THEN** 系統 SHALL 回傳原始指數 OHLC
- **AND** SHALL NOT 因無價格調整事件而回傳錯誤

## ADDED Requirements

### Requirement: Backward adjusted price calculation
The system SHALL calculate backward adjusted OHLC by multiplying each candle's price fields by the product of applicable event factors.

An event SHALL apply to a candle only when `candle.date < event.effectiveDate`.

If multiple events apply to a candle, their factors SHALL be multiplied together.

#### Scenario: Apply event before effective date
- **WHEN** an event for symbol `2330` has `effectiveDate: 2025-07-01` and `factor: 0.95`
- **AND** an OHLC candle has `date: 2025-06-30`
- **THEN** the adjusted OHLC price fields SHALL equal raw price fields multiplied by `0.95`

#### Scenario: Do not adjust event date candle
- **WHEN** an event for symbol `2330` has `effectiveDate: 2025-07-01`
- **AND** an OHLC candle has `date: 2025-07-01`
- **THEN** the candle's adjusted OHLC price fields SHALL equal the raw OHLC price fields for that event

#### Scenario: Multiply same-day event factors
- **WHEN** two events for symbol `2330` share the same `effectiveDate` with factors `0.9` and `0.8`
- **AND** an OHLC candle date is before that effective date
- **THEN** the adjusted OHLC price fields SHALL be multiplied by `0.72`
