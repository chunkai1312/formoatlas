## Purpose
定義個股除權息事件的儲存與查詢能力，作為向前還原（backward-adjusted）OHLC 計算的資料基礎。

## Requirements

### Requirement: 除權息事件資料模型
系統 SHALL 維護每支個股的除權息事件清單，每筆事件 SHALL 包含：
- `symbol`：stock symbol（string，必填）
- `exDate`：除權息日（ISO date string，必填）
- `cashDividend`：現金股利（number，元/股，無則為 0）
- `stockDividend`：股票股利（number，股/千股，無則為 0）
- `splitRatio`：股票分割比率（number，拆股為 > 1、合股為 < 1，無則為 1）

事件清單 SHALL 依 `exDate` 升冪排序儲存。

#### Scenario: 儲存除權息事件
- **WHEN** symbol `2330` 有一筆 `exDate=2025-07-15`、`cashDividend=3.5`、`stockDividend=0`、`splitRatio=1` 的除權息事件
- **THEN** 系統 SHALL 能以 `(symbol, exDate)` 為鍵查詢該事件

### Requirement: 向前還原係數計算
系統 SHALL 根據除權息事件清單，計算指定日期前每筆 OHLC 所需的還原乘數（backward-adjustment factor）。

還原乘數計算規則 SHALL 採用以下公式（複合調整）：
$$f_t = \prod_{e : \text{exDate}_e > t} \frac{P_{\text{pre},e} - D_e}{P_{\text{pre},e}}$$

其中 $P_{\text{pre},e}$ 為除權息日前一交易日的收盤價，$D_e$ 為等效現金調整金額（含現金股利與股票股利折算）。

若 symbol 為指數或無任何除權息事件，系統 SHALL 回傳乘數 `1.0`，不報錯。

#### Scenario: 單一現金股利還原
- **WHEN** symbol `2330` 於 `2025-07-15` 配息 3 元，`2025-07-14` 收盤價為 900 元
- **THEN** 2025-07-14 之前所有 OHLC 的還原乘數 SHALL 為 `(900 - 3) / 900 ≈ 0.99667`

#### Scenario: 無事件 symbol 還原係數為 1
- **WHEN** symbol 無任何除權息事件（例如指數 `IX0001`）
- **THEN** 所有日期的還原乘數 SHALL 為 `1.0`

### Requirement: 還原 OHLC 套用
系統 SHALL 將還原乘數套用至 `openPrice`、`highPrice`、`lowPrice`、`closePrice` 欄位，產出還原後的 OHLC 序列。

`tradeValue`、`tradeVolume` 及其他非價格欄位 SHALL NOT 受還原乘數影響。

還原後的價格 SHALL 保留原始資料的相對漲跌方向，以維持台股紅漲綠跌語意正確性。

#### Scenario: 還原後漲跌語意保持一致
- **WHEN** 某日原始 `closePrice` > 前日原始 `closePrice`（上漲）
- **THEN** 還原後 `closePrice` SHALL 同樣 > 還原後前日 `closePrice`（仍為上漲）

#### Scenario: 成交值不受還原影響
- **WHEN** 查詢 `adjusted=true` 的 OHLC
- **THEN** 回傳的 `tradeValue` 與 `tradeVolume` SHALL 與 `adjusted=false` 時相同
