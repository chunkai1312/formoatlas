## MODIFIED Requirements

### Requirement: 建立與恢復市場研究對話
系統 SHALL 允許已登入使用者建立市場研究對話，並載入該使用者擁有的對話詳情與訊息歷史。Conversation record SHALL 保存 app-owned stable `copilotSessionId`，且 conversation-scoped agent execution SHALL use that identifier to create or resume Copilot runtime session state.

#### Scenario: 建立新對話
- **WHEN** 已登入 client 建立新的市場研究對話
- **THEN** 系統 SHALL 建立 user-scoped conversation，並回傳 conversation id 與初始摘要

#### Scenario: 保存 Copilot session identifier
- **WHEN** 系統建立新的市場研究對話
- **THEN** conversation record SHALL 保存 app-owned stable `copilotSessionId`
- **AND** client MUST NOT be allowed to provide or mutate that `copilotSessionId`

#### Scenario: 使用 Copilot session identifier 恢復 runtime session
- **WHEN** 已登入 client 在 conversation 中送出 market research message
- **THEN** 系統 SHALL use that conversation's stored `copilotSessionId` when creating or resuming Copilot SDK session state
- **AND** 系統 SHALL enforce conversation ownership before using the session id

#### Scenario: 載入對話詳情
- **WHEN** 已登入 client 請求自己擁有的 conversation detail
- **THEN** 系統 SHALL 回傳 conversation metadata 與該 conversation 的 messages

#### Scenario: 拒絕讀取其他使用者對話
- **WHEN** 已登入 client 請求不屬於自己的 conversation detail
- **THEN** 系統 SHALL 回傳 not found 或 forbidden response，且 MUST NOT 暴露該 conversation 是否存在於其他使用者帳號下

#### Scenario: 重新整理後恢復最近對話
- **WHEN** 已登入 web app 初始化研究助理狀態
- **THEN** web app SHALL 載入最近的 conversation summary，並可恢復最近開啟或最近更新的 thread

### Requirement: 刪除使用者對話
系統 SHALL 允許已登入使用者刪除自己擁有的市場研究對話及其訊息。刪除含有 `copilotSessionId` 的 conversation 時，系統 SHALL attempt best-effort cleanup of the app-owned Copilot runtime session state.

#### Scenario: 刪除自己的對話
- **WHEN** 已登入 client 刪除自己擁有的 conversation
- **THEN** 系統 SHALL 移除或隱藏該 conversation 與其 messages，使該使用者的對話列表不再顯示它

#### Scenario: 刪除 Copilot session state
- **WHEN** 系統刪除含有 `copilotSessionId` 的 conversation
- **THEN** 系統 SHALL attempt to delete the corresponding app-owned Copilot session state through the shared Copilot runtime
- **AND** client MUST NOT directly specify or operate on Copilot session id

#### Scenario: Copilot session cleanup 失敗
- **WHEN** app-owned conversation/messages deletion succeeds but Copilot session cleanup fails
- **THEN** 系統 SHALL log the cleanup failure
- **AND** 系統 SHALL NOT restore the deleted app-owned conversation or messages

#### Scenario: 拒絕刪除其他使用者對話
- **WHEN** 已登入 client 嘗試刪除不屬於自己的 conversation
- **THEN** 系統 SHALL 回傳 not found 或 forbidden response，且 MUST NOT 修改其他使用者資料
