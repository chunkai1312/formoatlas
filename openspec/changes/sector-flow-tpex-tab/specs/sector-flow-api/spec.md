## ADDED Requirements

### Requirement: OTC sector flow via market parameter
系統 SHALL 在 `GET /marketdata/sector-flow` endpoint 支援選填的 `market` query parameter（`TSE` | `OTC`），預設值為 `TSE`，向下相容。

當 `market=OTC` 時：
- 查詢 `Market.OTC` 市場的兩個最近交易日資料
- 回傳 OTC 所有獨立產業指數，排除以下指數：
  - `IX0043`（TPEX 櫃買指數）：整體基準指數，非獨立產業
  - `IX0047`（TPExElectronic 櫃買電子類）：電子子類的聚合指數，類比 TSE 的 IX0027
- 回傳欄位格式與 TSE 相同（`symbol`、`name`、`date`、`closePrice`、`change`、`changePercent`、`tradeValue`、`tradeValuePrev`、`tradeValueChange`、`tradeWeight`、`tradeWeightPrev`、`tradeWeightChange`、`rs`）
- `name` 欄位透過 `getSectorName()` 清理（移除「櫃買」前綴及「類指數」後綴）

#### Scenario: OTC sector flow query
- **WHEN** client sends `GET /marketdata/sector-flow?date=2026-03-13&market=OTC`
- **THEN** system returns HTTP 200 with array of 23 OTC sector indices（排除 IX0043、IX0047）

#### Scenario: Default market is TSE
- **WHEN** client sends `GET /marketdata/sector-flow?date=2026-03-13` (no market param)
- **THEN** system returns TSE sectors, behavior unchanged from before

#### Scenario: OTC non-trading day query
- **WHEN** client sends OTC query for a non-trading day
- **THEN** system returns most recent available OTC trading day data using `$lte date` semantics

#### Scenario: OTC name cleaning
- **WHEN** OTC sector data returns name `"櫃買半導體類指數"`
- **THEN** `name` field in response is `"半導體"`
