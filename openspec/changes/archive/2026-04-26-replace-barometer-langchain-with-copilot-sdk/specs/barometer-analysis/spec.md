## MODIFIED Requirements

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
