## MODIFIED Requirements

### Requirement: 深色模式視覺主題
系統 SHALL 在深色模式下套用 TradingView 風格的深色調色盤，所有頁面元件均須支援雙主題，PrimeNG 元件與應用程式自有樣式 SHALL 與同一套 FormoAtlas CSS token 同步。

#### Scenario: 頁面背景與表面色
- **WHEN** 深色模式啟用
- **THEN** 頁面背景 SHALL 為 `#131722`，卡片表面 SHALL 為 `#1E222D`，Toolbar/Footer 等提升表面 SHALL 為 `#2A2E39`

#### Scenario: 文字顏色
- **WHEN** 深色模式啟用
- **THEN** 主要文字 SHALL 為 `#D1D4DC`，次要/輔助文字 SHALL 為 `#787B86`

#### Scenario: Toolbar 深色樣式
- **WHEN** 深色模式啟用
- **THEN** Toolbar 背景 SHALL 改為 `#1E222D`（與頁面融合），並加入 `1px solid #363A45` 的底部分隔線；淺色模式下維持 `#1565C0` 深藍背景

#### Scenario: 晴雨表色彩提亮
- **WHEN** 深色模式啟用且顯示晴雨等級
- **THEN** 各等級色彩（用於 border 與 label/chip 類元件）SHALL 使用提亮版本：STRONG_BULL=#FBBF24 / BULL=#4ADE80 / NEUTRAL=#9CA3AF / BEAR=#60A5FA / STRONG_BEAR=#818CF8

#### Scenario: 漲跌色彩（台灣慣例）
- **WHEN** 深色模式啟用
- **THEN** 正值（漲）SHALL 顯示為 `#F87171`（提亮紅），負值（跌）SHALL 顯示為 `#4ADE80`（提亮綠）

#### Scenario: PrimeNG 元件跟隨主題
- **WHEN** 深色模式啟用
- **THEN** 所有 PrimeNG 元件與 overlay（button、menu、date picker、tabs、tag/chip、progress spinner 等）SHALL 套用深色主題或等效 token 樣式

#### Scenario: Echarts 圖表跟隨主題
- **WHEN** 深色模式啟用
- **THEN** 所有 ngx-echarts 圖表 SHALL 切換至 echarts 內建 `dark` theme
