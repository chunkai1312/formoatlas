## MODIFIED Requirements

### Requirement: 互動式市場研究 Query API
系統 SHALL 提供單輪市場研究問題 API，使用選取交易日、選填頁面脈絡與選填 assistant mode 回答問題。支援的頁面 route context SHALL 包含 `home`、`market-overview`、`sector-flow`、`hot-stocks` 與 `stock-detail`。**API 端點 SHALL 受 JWT Auth Guard 保護，未登入的 request 將收到 401。**

Assistant mode SHALL support `research`、`scan`、`stock`。若 request 未指定 mode，系統 SHALL 使用 `research`。

Mode SHALL adjust prompt framing only; response SHALL keep the existing validated market research output schema.

#### Scenario: 送出有效市場研究問題
- **WHEN** 已登入 client 送出非空白問題與選取的 `date`
- **THEN** 系統 SHALL 呼叫市場研究 agent，並回傳該問題的結構化答案

#### Scenario: 送出頁面脈絡
- **WHEN** 已登入 client 在問題中包含 `home`、`market-overview`、`sector-flow`、`hot-stocks`、`stock-detail` 或其他支援的頁面脈絡
- **THEN** 系統 SHALL 將該脈絡提供給 agent 作為預設分析脈絡

#### Scenario: 送出研究模式
- **WHEN** 已登入 client 送出 `mode=research`
- **THEN** 系統 SHALL instruct the agent to answer as a general market research question
- **AND** response schema SHALL remain unchanged

#### Scenario: 送出掃描模式
- **WHEN** 已登入 client 送出 `mode=scan`
- **THEN** 系統 SHALL instruct the agent to prioritize abnormalities, strength/weakness, flow signals, and risk observations
- **AND** response schema SHALL remain unchanged

#### Scenario: 送出個股模式
- **WHEN** 已登入 client 送出 `mode=stock` with `context.symbol`
- **THEN** 系統 SHALL instruct the agent to prioritize that stock's price action, institutional flow, industry context, market context, and follow-up indicators
- **AND** response schema SHALL remain unchanged

#### Scenario: 缺少選取日期
- **WHEN** 已登入 client 送出問題但未提供選取的 `date`
- **THEN** 系統 SHALL 以 validation error 拒絕該 request

#### Scenario: 問題無效或過長
- **WHEN** 已登入 client 送出空白問題或超過支援長度的問題
- **THEN** 系統 SHALL 以 validation error 拒絕該 request，且 MUST NOT 呼叫 Copilot

#### Scenario: 未登入 client 送出問題
- **WHEN** 未登入 client 呼叫 `/api/agent/market-research` 或 `/api/agent/market-research/stream`
- **THEN** 系統 SHALL 回傳 401，MUST NOT 呼叫 Copilot

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

#### Scenario: Agent 需要個股摘要脈絡
- **WHEN** agent 需要某 symbol 在指定日期的個股量價、法人、產業或市場脈絡
- **THEN** it SHALL 使用包含明確 `symbol` 與 `date` 的 read-only stock summary tool

#### Scenario: Agent 要求非市場工具
- **WHEN** Copilot session 要求 file、shell、git、web、MCP、write-capable 或 unregistered tool access
- **THEN** 系統 SHALL 拒絕該 permission request，且 MUST NOT 執行該 tool

### Requirement: Web 研究助理 Panel
web app SHALL 在既有市場頁面、首頁與個股頁提供 research assistant panel 或 drawer。Session view SHALL use a bottom composer pattern for market research questions and SHALL expose assistant mode controls for supported intent modes without changing agent response rendering semantics.

#### Scenario: 從首頁開啟助理
- **WHEN** user 從 `/` 首頁開啟助理
- **THEN** panel SHALL 在不離開首頁的情況下開啟，且 SHALL 使用 `home` route context

#### Scenario: 從市場頁面開啟助理
- **WHEN** user 從 `/market-overview`、`/sector-flow` 或 `/hot-stocks` pages 開啟助理
- **THEN** panel SHALL 在不離開目前頁面的情況下開啟，且 SHALL 使用對應的 route context

#### Scenario: 從個股頁開啟助理
- **WHEN** user 從 `/stocks/:symbol` page 開啟助理
- **THEN** panel SHALL 在不離開目前頁面的情況下開啟
- **AND** SHALL 使用 `stock-detail` route context with current `symbol` and resolved `market`

#### Scenario: Session composer 置底
- **WHEN** user 進入 research assistant session view
- **THEN** panel SHALL keep the question composer at the bottom of the session view
- **AND** the message thread SHALL use the remaining vertical space as the primary scroll area
- **AND** the composer textarea SHALL use the full available composer width rather than being compressed by mode or submit controls

#### Scenario: 顯示助理模式入口
- **WHEN** user views the session composer
- **THEN** web app SHALL present controls for `research`、`scan`、`stock` modes
- **AND** selected mode SHALL be included in submitted agent requests

#### Scenario: 預設研究模式
- **WHEN** user opens assistant panel outside a stock-specific shortcut
- **THEN** selected assistant mode SHALL default to `research`

#### Scenario: 個股快捷入口使用個股模式
- **WHEN** user opens or submits assistant from a stock detail shortcut
- **THEN** selected assistant mode SHALL be `stock`
- **AND** submitted context SHALL include the stock symbol

#### Scenario: 從助理 Panel 送出問題
- **WHEN** user 從 assistant panel 的 session composer 送出問題
- **THEN** web app SHALL 將問題、選取日期、assistant mode 與支援的頁面脈絡送到 agent API，並顯示 streaming progress events

#### Scenario: 呈現結構化答案
- **WHEN** agent API 透過 final event 回傳有效結構化答案
- **THEN** panel SHALL 呈現 summary、key findings、evidence references 與 follow-up questions

#### Scenario: Agent Request 失敗
- **WHEN** agent API 回傳 validation、unavailable、timeout errors 或 streaming error event
- **THEN** panel SHALL 顯示可恢復的 error state，且不干擾目前頁面
