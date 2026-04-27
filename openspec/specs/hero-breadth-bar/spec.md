## Purpose
定義晴雨表 Hero Card 中市場廣度比例條的輸入、顯示方式、台灣市場漲跌色彩慣例，以及舊資料或缺資料時的隱藏行為，讓市場廣度資訊能以穩定且不誤導的方式呈現。

## Requirements

### Requirement: 三色廣度比例條顯示
`BreadthBarComponent` SHALL 接受上漲、平盤、下跌家數作為 input，以三色水平比例條呈現市場廣度分佈，左側為上漲（紅色），中間為平盤（灰色），右側為下跌（綠色）。各段寬度以總家數為分母計算百分比，三段加總等於 100%。

#### Scenario: 正常顯示三色比例條
- **WHEN** `advanceCount`、`unchangedCount`、`declineCount` 均有值
- **THEN** 元件 SHALL 顯示三色比例條，左側標示「上漲 XX.X% (N)」、右側標示「(N) XX.X% 下跌」

#### Scenario: 上漲比例色彩符合台灣慣例
- **WHEN** 元件渲染
- **THEN** 上漲段 SHALL 使用 `var(--color-positive)`（紅色）、下跌段 SHALL 使用 `var(--color-negative)`（綠色）、平盤段 SHALL 使用灰色

### Requirement: 廣度資料缺失時隱藏元件
若廣度欄位不存在（舊資料），`BreadthBarComponent` SHALL 不渲染任何內容。

#### Scenario: 無廣度資料時隱藏
- **WHEN** `advanceCount` 或 `declineCount` 為 `null` 或 `undefined`
- **THEN** 元件 SHALL 不顯示任何 DOM 元素
