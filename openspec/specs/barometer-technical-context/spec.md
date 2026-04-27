## Purpose
定義晴雨分析服務在產生 LLM prompt 前所需的技術面輔助指標，以及這些指標如何影響晴雨摘要判斷。

## Requirements

### Requirement: 計算技術面輔助指標
服務層 SHALL 在呼叫 LLM 之前，從歷史 `MarketStats` 資料計算技術面輔助指標，包含 5 日加權指數均價（5MA）、20 日加權指數均價（20MA）、5 日均量（tradeValue5MA）、今日量能比（volumeRatio = 今日成交金額 / 5MA 成交金額），並以 `TechContext` 介面傳遞。volumeRatio 僅在出現顯著放量（> 1.2）或顯著縮量（< 0.8）時才揭示於 prompt，量能平穩時不輸出。

#### Scenario: 歷史資料足夠時計算所有指標
- **WHEN** 系統查詢最近 30 個日曆天內有 20 筆以上有效交易日資料
- **THEN** 系統 SHALL 回傳完整的 `TechContext`，其中 `taiex5MA`、`taiex20MA`、`tradeValue5MA`、`volumeRatio` 均為有效數值（非 null）

#### Scenario: 歷史資料不足 20 筆時部分指標為 null
- **WHEN** 系統查詢後有效交易日資料少於 20 筆（但至少有 5 筆）
- **THEN** 系統 SHALL 回傳 `TechContext`，其中 `taiex20MA` 為 `null`，其餘可計算的欄位 SHALL 為有效數值

#### Scenario: 歷史資料少於 5 筆時全部為 null
- **WHEN** 系統查詢後有效交易日資料少於 5 筆
- **THEN** 系統 SHALL 回傳 `TechContext`，所有欄位均為 `null`，LLM 呼叫仍繼續進行

---

### Requirement: 將技術面輔助指標注入 LLM Prompt
`buildUserMessage` 函式 SHALL 接受第三個參數 `tech: TechContext | null`，並在使用者訊息中加入「技術面輔助」區塊，包含 `taiex5MA`、`taiex20MA`、`tradeValue5MA`。`volumeRatio` 僅在顯著放量（> 1.2）或顯著縮量（< 0.8）時才加入量能狀態提示，量能平穩時不輸出。

#### Scenario: TechContext 有完整資料且量能平穩
- **WHEN** `buildUserMessage` 收到完整 `TechContext`，且 `volumeRatio` 介於 0.8–1.2
- **THEN** 生成的訊息 SHALL 包含 `taiex5MA`、`taiex20MA`、`tradeValue5MA`，MUST NOT 包含 `volumeRatio` 數值

#### Scenario: TechContext 有完整資料且量能顯著放量
- **WHEN** `buildUserMessage` 收到完整 `TechContext`，且 `volumeRatio > 1.2`
- **THEN** 生成的訊息 SHALL 包含「顯著放量（volumeRatio X.XX）」的量能狀態提示

#### Scenario: TechContext 有完整資料且量能顯著縮量
- **WHEN** `buildUserMessage` 收到完整 `TechContext`，且 `volumeRatio < 0.8`
- **THEN** 生成的訊息 SHALL 包含「顯著縮量（volumeRatio X.XX）」的量能狀態提示

#### Scenario: TechContext 為 null 或部分欄位為 null
- **WHEN** `buildUserMessage` 收到 `null` 或含有 `null` 欄位的 `TechContext`
- **THEN** 對應欄位 SHALL 以 `N/A` 顯示，不影響訊息其他部分的生成

---

### Requirement: SYSTEM_PROMPT 包含技術面判斷準則
`SYSTEM_PROMPT` SHALL 包含「技術面輔助」說明區塊，定義各技術指標的語義及與籌碼訊號交叉確認的判斷邏輯。

#### Scenario: 均線多頭排列與籌碼偏多交叉確認
- **WHEN** LLM 接收到今日收盤價高於 20MA 且外資買超訊號
- **THEN** LLM 生成的摘要 SHALL 提及技術面與籌碼面共同偏多，等級傾向上調

#### Scenario: 量能萎縮時降低籌碼訊號強度
- **WHEN** LLM 接收到 `volumeRatio < 0.8`（量能明顯萎縮）
- **THEN** LLM 生成的摘要 SHOULD 提及量能不足，多空訊號說服力降低

#### Scenario: 技術面與籌碼面背離
- **WHEN** LLM 接收到籌碼偏多但指數仍在 20MA 以下
- **THEN** LLM 生成的摘要 SHALL 提及技術面與籌碼面存在背離，整體評級偏保守
