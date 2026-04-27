## 1. Backend Agent API

- [x] 1.1 建立獨立的 NestJS 市場研究 agent module、controller、service、DTO 與 response model files。
- [x] 1.2 為 question text、selected date 與支援的 page context fields 加入 request validation。
- [x] 1.3 實作單輪 agent endpoint；無效 input 需直接回傳 validation errors，且不呼叫 Copilot。
- [x] 1.4 將新的 agent module 串進 API app，且不改變既有 barometer 或 marketdata endpoints。

## 2. Copilot Session and Policy

- [x] 2.1 使用 `COPILOT_CLI_URL` 與 `COPILOT_MODEL` 建立 Copilot SDK client/session setup。
- [x] 2.2 新增市場研究 system prompt，將回答限制在盤後 market data analysis，並排除個人化交易建議。
- [x] 2.3 實作 permission handling，拒絕 file、shell、git、web、MCP、write-capable 與 unregistered tools。
- [x] 2.4 為 Copilot failures 與 invalid structured output 加入 bounded retry/error handling。
- [x] 2.5 套用 question length、date range、tool call count 與 request timeout 的 policy limits。

## 3. Read-Only Market Tools

- [x] 3.1 實作 read-only market stats range tool，使用既有 market stats repository 行為。
- [x] 3.2 實作 read-only barometer tool，讀取每日晴雨脈絡，且不改變排程晴雨表 workflow。
- [x] 3.3 實作 read-only sector flow 與 hot stocks tools，使用既有 ticker repository/service 行為。
- [x] 3.4 實作 read-only ticker OHLC tool，支援 symbol/date-range history。
- [x] 3.5 為 tool argument validation、range limits、missing data 與 non-market tool rejection 加入 unit coverage。

## 4. Structured Response

- [x] 4.1 定義 agent responses 的 Zod schema，包含 summary、key findings、evidence、follow-up questions 與選填 warnings。
- [x] 4.2 在回傳 client 前 parse 並 validate Copilot responses。
- [x] 4.3 確保 evidence metadata 在適用時包含 source type 與相關 date、range、market、sector 或 symbol。
- [x] 4.4 為 valid output、invalid output retry、final invalid output failure 與 partial-data warnings 加入 tests。

## 5. Web Assistant Panel

- [x] 5.1 新增 Angular core models 與 service methods，用於送出 market research agent queries。
- [x] 5.2 建立 shared research assistant panel 或 drawer，可從既有市場頁面開啟且不觸發 navigation。
- [x] 5.3 從 dashboard、sector flow 與 hot stocks pages 傳送 selected date 與支援的 page context。
- [x] 5.4 呈現 loading、validation error、unavailable/timeout error、summary、key findings、evidence、warnings 與 follow-up question states。
- [x] 5.5 確保 panel 在 desktop 與 mobile layouts 中可用，且不與既有 toolbar/page content 重疊。

## 6. Streaming Experience

- [x] 6.1 新增 backend streaming endpoint，以 SSE/status events 回報 agent processing、tool_start、tool_result、final 與 error states。
- [x] 6.2 讓 read-only market tools 在呼叫前後發出 streaming tool status events，且不暴露敏感 runtime details。
- [x] 6.3 確保 streaming final event 只包含通過 Zod schema validation 的 structured answer。
- [x] 6.4 更新 Angular agent service 支援 streaming consumer，並解析 status/tool/final/error events。
- [x] 6.5 更新 assistant panel 顯示 streaming progress timeline，且只在 final event 後呈現正式答案。
- [x] 6.6 為 backend streaming event sequence 與 frontend streaming rendering/error behavior 加入 tests。

## 7. Verification

- [x] 7.1 為 agent controller/service happy path 與 error paths 加入 backend tests。
- [x] 7.2 為 assistant panel rendering 與 query submission behavior 加入 frontend tests。
- [x] 7.3 執行 API 與 web test suites 或 targeted Nx tests。
- [x] 7.4 執行 API 與 web builds。
- [x] 7.5 使用 dashboard、sector flow 與 hot stocks context 手動驗證 assistant 可回答代表性問題，並確認 streaming progress 顯示正常。
