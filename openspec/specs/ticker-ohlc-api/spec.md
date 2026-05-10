## Purpose
定義個股與指數 OHLC 查詢 API 的參數、預設日期範圍、錯誤處理與回傳資料排序，讓前端圖表能以一致格式取得指定商品的歷史行情資料。

## Requirements

### Requirement: OHLC 查詢端點
系統 SHALL 提供 `GET /marketdata/tickers` 端點，依 symbol 與日期區間回傳收盤行情資料。

#### Scenario: 成功查詢指定 symbol 的 OHLC 資料
- **WHEN** 呼叫 `GET /marketdata/tickers?symbol=IX0001&startDate=2025-09-01&endDate=2026-03-12`
- **THEN** 系統 SHALL 回傳 HTTP 200，body 為陣列，每筆包含 `date`、`openPrice`、`highPrice`、`lowPrice`、`closePrice`、`tradeValue`，並依 `date` 升冪排序

#### Scenario: symbol 為必填
- **WHEN** 呼叫 `GET /marketdata/tickers` 未帶 `symbol`
- **THEN** 系統 SHALL 回傳 HTTP 400

#### Scenario: 日期預設值
- **WHEN** 呼叫 `GET /marketdata/tickers?symbol=IX0001` 未帶日期參數
- **THEN** 系統 SHALL 以當日往前 3 個月為 `startDate`、當日為 `endDate` 查詢

### Requirement: 還原 OHLC 查詢
系統 SHALL 支援 `adjusted` 布林查詢參數，以控制是否回傳除權息還原後的 OHLC。

`adjusted` 參數僅影響價格欄位（`openPrice`、`highPrice`、`lowPrice`、`closePrice`）；成交值（`tradeValue`）、成交量（`tradeVolume`）與其他權重欄位 SHALL 保持原始未還原值。

當 `adjusted` 未提供或為 `false` 時，系統 SHALL 維持現有的原始 OHLC 行為，不作任何調整。

#### Scenario: 個股／ETF 還原查詢
- **WHEN** 呼叫 `GET /marketdata/tickers?symbol=2330&adjusted=true`
- **THEN** 系統 SHALL 回傳 HTTP 200，價格欄位為向前還原（backward-adjusted）後的數值
- **AND** `tradeValue`、`tradeVolume` 等非價格欄位保持原始值

#### Scenario: 指數不支援還原仍回傳原始資料
- **WHEN** 呼叫 `GET /marketdata/tickers?symbol=IX0001&adjusted=true`（指數 symbol）
- **THEN** 系統 SHALL 回傳 HTTP 200 並回傳原始 OHLC（無錯誤）

#### Scenario: 個股無除權息事件時仍回傳原始資料
- **WHEN** 呼叫 `GET /marketdata/tickers?symbol=2330&adjusted=true` 且該 symbol 無任何除權息事件
- **THEN** 系統 SHALL 回傳 HTTP 200 並回傳原始 OHLC（無錯誤）

#### Scenario: 未帶 adjusted 參數維持原有行為
- **WHEN** 呼叫 `GET /marketdata/tickers?symbol=2330` 未帶 `adjusted`
- **THEN** 系統 SHALL 回傳原始 OHLC，行為與既有規格相同
