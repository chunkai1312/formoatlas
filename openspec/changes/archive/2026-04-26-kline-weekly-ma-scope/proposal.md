## Why

目前週 K 模式只抓近 2 年日資料後再聚合成週資料，但規格仍要求顯示 MA120 與 MA240。這造成週 K 圖表與 MA info bar 無法穩定呈現長天期均線，形成規格與實際資料窗不一致的問題。

## What Changes

- 調整 Dashboard K 線圖的需求定義，明確區分日 K 與週 K 支援的 MA 週期。
- 保留日 K 模式的 MA5、MA10、MA20、MA60、MA120、MA240。
- 將週 K 模式限縮為只顯示 MA5、MA10、MA20、MA60，不再顯示 MA120、MA240 的線與 info bar 數值。
- 將週 K 的產品行為定義為「不顯示未支援的長天期 MA」，而非接受資料不足造成的不完整呈現。

## Capabilities

### New Capabilities

### Modified Capabilities
- `dashboard-kline-chart`: 調整週 K 模式的均線支援範圍與 MA info bar 顯示規則，使其與 2Y 週資料視窗一致

## Impact

- OpenSpec 規格：`dashboard-kline-chart`
- 前端圖表邏輯：`KlineChartComponent` 的 MA 定義、週 K 顯示條件與 info bar
- 無後端 API、資料 schema 或外部依賴變更
