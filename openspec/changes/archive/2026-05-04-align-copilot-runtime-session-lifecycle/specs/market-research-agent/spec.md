## 修改 Requirements

### Requirement: Copilot SDK Agent Provider
系統 SHALL 透過 GitHub Copilot SDK shared runtime 連線至設定的 Copilot CLI headless server 產生市場研究答案。單輪市場研究 request SHALL 使用 ephemeral Copilot session；conversation-scoped request SHALL 使用 conversation-owned 的穩定 Copilot session id。

#### Scenario: 已設定 Headless CLI URL
- **WHEN** agent 處理有效 query，且 API process 可讀取 `COPILOT_CLI_URL`
- **THEN** 系統 SHALL 透過 shared Copilot runtime 對該 headless CLI server 建立或恢復 Copilot SDK session

#### Scenario: 單輪市場研究使用 ephemeral session
- **WHEN** 已登入 client 呼叫 `/api/agent/market-research` 或 `/api/agent/market-research/stream`
- **THEN** 系統 SHALL 使用全新 ephemeral Copilot session 執行該 query
- **AND** 系統 SHALL 在 request 完成或失敗後 disconnect 該 session

#### Scenario: Conversation-scoped 市場研究使用 stable session
- **WHEN** 已登入 client 呼叫 `/api/agent/conversations/:id/messages/stream`
- **THEN** 系統 SHALL 使用該 owned conversation 的 `copilotSessionId` 建立或恢復 Copilot session
- **AND** 系統 SHALL 在 request 完成或失敗後 disconnect 該 session，同時保留可恢復的 session state

#### Scenario: 缺少 Headless CLI URL
- **WHEN** agent 處理有效 query，但 API process 無法讀取 `COPILOT_CLI_URL`
- **THEN** 系統 SHALL 回傳 service unavailable response
- **AND** 系統 MUST NOT 建立 Copilot session

#### Scenario: Copilot 呼叫失敗
- **WHEN** Copilot SDK、headless CLI server、認證或 session execution 失敗
- **THEN** 系統 SHALL 回傳 service unavailable response，且不影響既有 dashboard APIs

## 新增 Requirements

### Requirement: Conversation Session 序列化
系統 SHALL 對同一 conversation-scoped Copilot session 的寫入進行序列化，使並發 request 無法同時對同一 runtime session 進行變更。

#### Scenario: Conversation request 取得 session lock
- **WHEN** conversation-scoped 市場研究 request 開始執行
- **THEN** 系統 SHALL 在向 Copilot 送出 prompt 前，取得以該 conversation 的 `copilotSessionId` 為 key 的應用程式層級鎖定

#### Scenario: 相同 conversation 的並發 request
- **WHEN** 另一個 request 嘗試在已有 request 執行中的情況下，對相同 conversation `copilotSessionId` 執行
- **THEN** 系統 SHALL 依設定的鎖定 policy，對後進 request 進行序列化、拒絕或逾時處理
- **AND** 系統 MUST NOT 向同一 Copilot session 送出並發 prompt

#### Scenario: 不同 conversation 的 request
- **WHEN** 兩個 request 對不同 conversation `copilotSessionId` 執行
- **THEN** 系統 MAY 允許它們在全局服務限制下並發執行
