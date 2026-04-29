## Why

市場熱力圖目前只以市值決定矩形大小，能呈現市場結構，但無法回答「今天資金主要集中在哪些個股或產業」。加入當日成交金額大小模式，可以讓同一張熱力圖在「權值結構」與「資金熱度」之間切換，提升首頁掃描市場的資訊密度。

## What Changes

- 市場熱力圖新增大小維度切換：`市值` 與 `成交金額`。
- 預設維持 `市值` 模式，保留既有首頁第一眼的市場結構語意。
- `成交金額` 模式下，個股矩形大小 SHALL 依當日 `tradeValue` 決定，產業父節點大小 SHALL 依產業內個股 `tradeValue` 加總決定。
- 熱力圖顏色仍固定依 `changePercent` 使用台股紅漲綠跌色階。
- 產業父節點的加權漲跌幅 SHALL 跟隨目前大小維度：市值模式用市值加權，成交金額模式用成交金額加權。
- Market map API response 增加成交金額資料，讓前端可在不重新請求 API 的情況下切換大小維度。
- Tooltip 維持精簡 OHLCV 與漲跌資訊，不顯示大小指標、市值或成交金額。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `market-heatmap`: 市場熱力圖支援在市值與當日成交金額之間切換矩形大小維度，並擴充 market-map response 與 tooltip 資訊。

## Impact

- Backend API contract: `GET /marketdata/market-map` response 需包含個股 `tradeValue` 與產業 `totalTradeValue`。
- Backend repository: market map aggregation 需輸出成交金額加總，並保留既有市值計算邏輯。
- Frontend model/service: `MarketMapItem` 與 `MarketMapSector` 需新增成交金額欄位。
- Frontend UI: 首頁市場熱力圖區塊需新增大小維度控制，並更新說明文案。
- Frontend chart: ECharts treemap option builder 需根據大小維度選擇 size value 與產業加權漲跌幅。
- Tests/specs: 更新 market heatmap contract、UI rendering、chart data mapping 與 tooltip 行為測試。
