## Purpose

定義台股晴雨表分析 API 的回傳內容、晴雨等級、LLM 摘要格式、期貨日變化語意化與分析結果快取行為。

## Requirements
### Requirement: 取得當日台股晴雨表分析
系統 SHALL 提供 `GET /marketdata/barometer` endpoint，接受 `date`（`YYYY-MM-DD` 格式）查詢參數（選填，預設為當天），回傳該日的晴雨等級、天氣圖示、中文標籤，以及 GitHub Copilot SDK 生成的 200-350 字繁體中文盤勢摘要（依訊號複雜程度彈性調整）。

#### Scenario: 請求有快取的日期
- **WHEN** 用戶請求某日期且該日 `MarketStats.aiAnalysis` 已有快取資料
- **THEN** 系統 SHALL 直接回傳快取結果，不呼叫 LLM

#### Scenario: 請求無快取的日期（資料存在）
- **WHEN** 用戶請求某日期且 `MarketStats` 有該日數據但 `aiAnalysis` 欄位為空
- **THEN** 系統 SHALL 取得該日與前一交易日的 `MarketStats` 數據，透過 GitHub Copilot SDK 連線至 Copilot CLI headless server 呼叫 LLM 進行分析，成功後將結果寫回 `MarketStats.aiAnalysis`，並回傳分析結果

#### Scenario: 請求無市場數據的日期
- **WHEN** 用戶請求某日期且 `MarketStats` 不存在該日任何記錄（假日或未收集）
- **THEN** 系統 SHALL 回傳 HTTP 404

#### Scenario: LLM 服務不可用
- **WHEN** 呼叫 GitHub Copilot SDK 發生錯誤、認證失敗、timeout，或回傳格式無效
- **THEN** 系統 SHALL 回傳 HTTP 503，不寫入快取

### Requirement: 晴雨等級五層定義
系統 SHALL 使用固定的五層晴雨等級體系，每層對應天氣圖示與中文標籤。

#### Scenario: 回傳正確的等級對應
- **WHEN** LLM 輸出任一有效等級代碼
- **THEN** 系統 SHALL 回傳對應的天氣圖示與中文標籤，且 MUST 符合下表：
  - `STRONG_BULL` → ☀️ → 強多
  - `BULL` → 🌤 → 偏多
  - `NEUTRAL` → ⛅ → 中性
  - `BEAR` → 🌧 → 偏空
  - `STRONG_BEAR` → ⛈ → 強空

---

### Requirement: LLM 分析輸出格式
LLM 生成的盤勢摘要 SHALL 以繁體中文撰寫，字數介於 200 至 350 字（依當日訊號複雜程度彈性調整：訊號高度一致時可精簡至 200 字，訊號複雜或矛盾時應充分說明至 350 字），內容 MUST 包含：今日最顯著的多空訊號、與前日相比的趨勢變化、整體籌碼氛圍的描述。摘要 MUST NOT 做出絕對的漲跌預測。

#### Scenario: 摘要內容包含趨勢對比
- **WHEN** LLM 生成摘要
- **THEN** 摘要文字 SHALL 提及至少一項指標與前日相比的變化方向（如「較昨日擴大」、「由賣轉買」）

#### Scenario: 摘要不做絕對預測
- **WHEN** LLM 生成摘要
- **THEN** 摘要文字 MUST NOT 包含「明天將上漲」、「必定下跌」等確定性預測語句，只描述籌碼與技術面現象

#### Scenario: 摘要包含技術面交叉確認
- **WHEN** LLM 生成摘要且 `TechContext` 資料有效（非全部 null）
- **THEN** 摘要文字 SHALL 至少提及一項技術面指標（均線位置或量能狀態）與籌碼訊號的相互印證或背離說明

---

### Requirement: 期貨淨未平倉日變化語意明確
系統 SHALL 在傳入 LLM 的 user message 中，對外資台指期貨、散戶微台、散戶小台的淨未平倉日變化值，根據底倉方向轉換為語意標籤（如「多單增加 N 口」、「空單增加 N 口」、「空單減少 N 口」），不傳遞原始正負數值。

#### Scenario: 底倉為正（淨多方向）時的變化標籤
- **WHEN** 期貨淨未平倉底倉為正值，且日變化為正
- **THEN** 語意標籤 SHALL 顯示「多單增加 N 口」

#### Scenario: 底倉為負（淨空方向）時的變化標籤
- **WHEN** 期貨淨未平倉底倉為負值，且日變化為負（空方加碼）
- **THEN** 語意標籤 SHALL 顯示「空單增加 N 口」（而非「減少 N 口」）

---

### Requirement: LLM 結果快取
系統 SHALL 在 LLM 首次成功分析後，將結果持久化儲存於對應日期的 `MarketStats.aiAnalysis` 欄位，確保相同日期的後續請求不重複呼叫 LLM。

#### Scenario: 快取寫入成功
- **WHEN** LLM 成功回傳結構化結果
- **THEN** 系統 SHALL 將完整結果寫入 `MarketStats.aiAnalysis`，後續同日期請求 MUST 直接讀取此快取

#### Scenario: LLM 失敗不寫入快取
- **WHEN** LLM 呼叫失敗或回傳格式無效
- **THEN** 系統 MUST NOT 寫入任何快取，以便下次可以重試
