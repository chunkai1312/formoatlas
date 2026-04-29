## ADDED Requirements

### Requirement: Conversation-Scoped Agent Streaming
系統 SHALL 提供受 JWT Auth Guard 保護的 conversation-scoped streaming endpoint，讓市場研究 agent 的結果附著在使用者對話中保存。

#### Scenario: Conversation streaming query 開始
- **WHEN** 已登入 client 對自己擁有的 conversation 送出有效 streaming market research query
- **THEN** 系統 SHALL 開啟 streaming response，保存 user message，並送出表示 agent 已開始處理的 status event

#### Scenario: Conversation streaming final answer
- **WHEN** conversation-scoped agent query 完成且 response schema validation 成功
- **THEN** 系統 SHALL 送出 final event，保存 completed assistant message，並更新 conversation 的 `lastMessageAt` 與 message count

#### Scenario: Conversation streaming error
- **WHEN** conversation-scoped agent query 最終失敗
- **THEN** 系統 SHALL 送出 error event，保存 failed assistant message，並結束 stream

#### Scenario: 拒絕不存在或非本人對話
- **WHEN** 已登入 client 對不存在或不屬於自己的 conversation 送出 streaming query
- **THEN** 系統 SHALL 回傳 not found 或 forbidden response，且 MUST NOT 呼叫 Copilot

#### Scenario: Conversation query 不使用完整歷史作為 agent memory
- **WHEN** 系統處理 conversation-scoped agent query
- **THEN** agent prompt SHALL 以當次 question、date 與 context 為主要輸入，且 MUST NOT 要求第一版 replay 完整 conversation history 或 resume persisted Copilot session

#### Scenario: Conversation 保存 Copilot session id 但不啟用 runtime memory
- **WHEN** conversation record 包含 `copilotSessionId`
- **THEN** 第一版 agent execution SHALL NOT use `copilotSessionId` to resume Copilot history, and SHALL keep existing single-turn runtime semantics
