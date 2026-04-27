## Purpose

定義 FormoAtlas 互動式市場研究 agent 的 API、Copilot SDK provider、read-only market tools、結構化證據答案、streaming 進度事件、執行限制與 web assistant panel 行為。
## Requirements
### Requirement: 互動式市場研究 Query API
系統 SHALL 提供單輪市場研究問題 API，使用選取交易日與選填頁面脈絡回答問題。支援的頁面 route context SHALL 包含 `home`、`market-overview`、`sector-flow` 與 `hot-stocks`。

#### Scenario: 送出有效市場研究問題
- **WHEN** client 送出非空白問題與選取的 `date`
- **THEN** 系統 SHALL 呼叫市場研究 agent，並回傳該問題的結構化答案

#### Scenario: 送出頁面脈絡
- **WHEN** client 在問題中包含 `home`、`market-overview`、`sector-flow`、`hot-stocks` 或其他支援的頁面脈絡
- **THEN** 系統 SHALL 將該脈絡提供給 agent 作為預設分析脈絡

#### Scenario: 缺少選取日期
- **WHEN** client 送出問題但未提供選取的 `date`
- **THEN** 系統 SHALL 以 validation error 拒絕該 request

#### Scenario: 問題無效或過長
- **WHEN** client 送出空白問題或超過支援長度的問題
- **THEN** 系統 SHALL 以 validation error 拒絕該 request，且 MUST NOT 呼叫 Copilot

### Requirement: Copilot SDK Agent Provider
系統 SHALL 透過 GitHub Copilot SDK 連線至設定的 Copilot CLI headless server 產生市場研究答案。

#### Scenario: 已設定 Headless CLI URL
- **WHEN** agent 處理有效 query，且 API process 可讀取 `COPILOT_CLI_URL`
- **THEN** 系統 SHALL 對該 headless CLI server 建立 Copilot SDK session

#### Scenario: 缺少 Headless CLI URL
- **WHEN** agent 處理有效 query，但 API process 無法讀取 `COPILOT_CLI_URL`
- **THEN** 系統 SHALL 回傳 service unavailable response

#### Scenario: Copilot 呼叫失敗
- **WHEN** Copilot SDK、headless CLI server、認證或 session execution 失敗
- **THEN** 系統 SHALL 回傳 service unavailable response，且不影響既有 dashboard APIs

### Requirement: Read-Only Market Data Tools
agent SHALL 只取得 allowlisted read-only tools，且這些 tools 必須以既有 FormoAtlas market data 為資料來源。

#### Scenario: Agent 需要大盤統計資料
- **WHEN** agent 需要大盤籌碼或歷史市場脈絡
- **THEN** it SHALL 使用具 start/end date 邊界限制的 read-only market stats range tool

#### Scenario: Agent 需要晴雨表脈絡
- **WHEN** agent 需要每日晴雨等級或 cached AI summary
- **THEN** it SHALL 使用指定日期的 read-only barometer tool

#### Scenario: Agent 需要類股資金流脈絡
- **WHEN** agent 需要某日期的 TSE 或 OTC sector money flow
- **THEN** it SHALL 使用包含明確 `date` 與 `market` 的 read-only sector flow tool

#### Scenario: Agent 需要熱門個股脈絡
- **WHEN** agent 需要某日期與市場的熱門個股排行
- **THEN** it SHALL 使用包含明確 `date` 與 `market` 的 read-only hot stocks tool

#### Scenario: Agent 需要 Ticker 歷史資料
- **WHEN** agent 需要某 symbol 的 OHLC history
- **THEN** it SHALL 使用包含明確 `symbol`、`startDate` 與 `endDate` 的 read-only ticker OHLC tool

#### Scenario: Agent 要求非市場工具
- **WHEN** Copilot session 要求 file、shell、git、web、MCP、write-capable 或 unregistered tool access
- **THEN** 系統 SHALL 拒絕該 permission request，且 MUST NOT 執行該 tool

### Requirement: 結構化且具證據引用的答案
agent SHALL 回傳可 parse、可驗證，且可被呈現為具證據引用市場研究 output 的答案。

#### Scenario: Agent 回傳有效結構化 Output
- **WHEN** Copilot 回傳包含 summary、key findings、evidence 與 follow-up questions 的答案
- **THEN** 系統 SHALL 在回傳 client 前驗證 response schema

#### Scenario: Evidence 引用來源資料
- **WHEN** agent 根據市場資料提出 finding
- **THEN** response SHALL 包含 evidence metadata，識別 source type 與適用的 date、range、market、sector 或 symbol

#### Scenario: 來源資料缺漏或不完整
- **WHEN** 必要 tool 對要求脈絡回傳無資料或部分資料
- **THEN** response SHALL 在 warnings 中說明限制，或避免提出 unsupported claims

#### Scenario: Agent 回傳無效結構化 Output
- **WHEN** Copilot 回傳無法 parse 或不符合 response schema 的 output
- **THEN** 系統 SHALL 最多執行一次 bounded retry，之後仍失敗則回傳 service unavailable response

### Requirement: Agent Status Streaming
系統 SHALL 支援以 streaming 方式回報市場研究 agent 的進度事件，並以 validated structured answer 作為最終結果。

#### Scenario: Streaming Query 開始
- **WHEN** client 送出有效 streaming market research query
- **THEN** 系統 SHALL 開啟 streaming response，並送出表示 agent 已開始處理的 status event

#### Scenario: Streaming Tool 狀態
- **WHEN** agent 準備呼叫或完成 read-only market data tool
- **THEN** 系統 SHALL 送出 tool status event，描述 tool name 與目前階段，但 MUST NOT 暴露敏感 runtime details

#### Scenario: Streaming Final Answer
- **WHEN** agent 完成回答且 response schema validation 成功
- **THEN** 系統 SHALL 送出 final event，且 final event SHALL 包含 validated structured answer

#### Scenario: Streaming Error
- **WHEN** agent execution、tool execution、Copilot 呼叫或 response validation 最終失敗
- **THEN** 系統 SHALL 送出 error event，並結束 stream

#### Scenario: Raw Token Streaming 不顯示為正式答案
- **WHEN** Copilot 產生尚未完成或尚未通過 schema validation 的 partial assistant text
- **THEN** web app MUST NOT 將該 partial text 呈現為正式市場研究答案

### Requirement: Agent Execution Policy Limits
系統 SHALL 限制市場研究 agent execution，以保護 service reliability 與 Copilot quota。

#### Scenario: 達到 Tool Call Limit
- **WHEN** agent 超過單一 request 允許的最大 tool calls
- **THEN** 系統 SHALL 停止額外 tool execution，並回傳 error 或一個說明限制的 validated answer

#### Scenario: Date Range 超過允許範圍
- **WHEN** agent 或 client 要求超過支援最大範圍的 market data range
- **THEN** 系統 SHALL 依設定 policy 拒絕或 clamp 該 tool request

#### Scenario: Agent Execution Timeout
- **WHEN** agent 無法在設定的 request timeout 內完成
- **THEN** 系統 SHALL 回傳 service unavailable response

### Requirement: Web 研究助理 Panel
web app SHALL 在既有市場頁面與首頁提供 research assistant panel 或 drawer。

#### Scenario: 從首頁開啟助理
- **WHEN** user 從 `/` 首頁開啟助理
- **THEN** panel SHALL 在不離開首頁的情況下開啟，且 SHALL 使用 `home` route context

#### Scenario: 從市場頁面開啟助理
- **WHEN** user 從 `/market-overview`、`/sector-flow` 或 `/hot-stocks` pages 開啟助理
- **THEN** panel SHALL 在不離開目前頁面的情況下開啟，且 SHALL 使用對應的 route context

#### Scenario: 從助理 Panel 送出問題
- **WHEN** user 從 assistant panel 送出問題
- **THEN** web app SHALL 將問題、選取日期與支援的頁面脈絡送到 agent API，並顯示 streaming progress events

#### Scenario: 呈現結構化答案
- **WHEN** agent API 透過 final event 回傳有效結構化答案
- **THEN** panel SHALL 呈現 summary、key findings、evidence references 與 follow-up questions

#### Scenario: Agent Request 失敗
- **WHEN** agent API 回傳 validation、unavailable、timeout errors 或 streaming error event
- **THEN** panel SHALL 顯示可恢復的 error state，且不干擾目前頁面

