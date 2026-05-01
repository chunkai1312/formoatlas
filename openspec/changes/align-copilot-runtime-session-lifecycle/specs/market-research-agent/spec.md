## MODIFIED Requirements

### Requirement: Copilot SDK Agent Provider
系統 SHALL 透過 GitHub Copilot SDK shared runtime 連線至設定的 Copilot CLI headless server 產生市場研究答案。單輪市場研究 request SHALL 使用 ephemeral Copilot session；conversation-scoped request SHALL 使用 conversation-owned stable Copilot session id。

#### Scenario: 已設定 Headless CLI URL
- **WHEN** agent 處理有效 query，且 API process 可讀取 `COPILOT_CLI_URL`
- **THEN** 系統 SHALL 透過 shared Copilot runtime 對該 headless CLI server 建立或恢復 Copilot SDK session

#### Scenario: 單輪市場研究使用 ephemeral session
- **WHEN** 已登入 client 呼叫 `/api/agent/market-research` 或 `/api/agent/market-research/stream`
- **THEN** 系統 SHALL 使用 fresh ephemeral Copilot session 執行該 query
- **AND** 系統 SHALL 在 request 完成或失敗後 disconnect 該 session

#### Scenario: Conversation-scoped 市場研究使用 stable session
- **WHEN** 已登入 client 呼叫 `/api/agent/conversations/:id/messages/stream`
- **THEN** 系統 SHALL 使用該 owned conversation 的 `copilotSessionId` 建立或恢復 Copilot session
- **AND** 系統 SHALL 在 request 完成或失敗後 disconnect 該 session while preserving resumable session state

#### Scenario: 缺少 Headless CLI URL
- **WHEN** agent 處理有效 query，但 API process 無法讀取 `COPILOT_CLI_URL`
- **THEN** 系統 SHALL 回傳 service unavailable response
- **AND** 系統 MUST NOT 建立 Copilot session

#### Scenario: Copilot 呼叫失敗
- **WHEN** Copilot SDK、headless CLI server、認證或 session execution 失敗
- **THEN** 系統 SHALL 回傳 service unavailable response，且不影響既有 dashboard APIs

## ADDED Requirements

### Requirement: Conversation Session Serialization
系統 SHALL serialize writes to the same conversation-scoped Copilot session so concurrent requests cannot mutate the same runtime session simultaneously.

#### Scenario: Conversation request acquires session lock
- **WHEN** a conversation-scoped market research request begins execution
- **THEN** 系統 SHALL acquire an application-level lock keyed by that conversation's `copilotSessionId` before sending prompts to Copilot

#### Scenario: Concurrent request for same conversation
- **WHEN** another request attempts to execute against the same conversation `copilotSessionId` while a request is already running
- **THEN** 系統 SHALL serialize, reject, or time out the later request according to the configured lock policy
- **AND** 系統 MUST NOT send concurrent prompts to the same Copilot session

#### Scenario: Requests for different conversations
- **WHEN** two requests execute against different conversation `copilotSessionId` values
- **THEN** 系統 MAY allow them to run concurrently subject to global service limits
