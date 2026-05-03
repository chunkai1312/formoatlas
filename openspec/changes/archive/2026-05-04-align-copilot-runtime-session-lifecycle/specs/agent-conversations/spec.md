## 修改 Requirements

### Requirement: 建立與恢復市場研究對話
系統 SHALL 允許已登入使用者建立市場研究對話，並載入該使用者擁有的對話詳情與訊息歷史。Conversation record SHALL 保存 app-owned stable `copilotSessionId`，且 conversation-scoped agent execution SHALL 使用該 identifier 建立或恢復 Copilot runtime session state。

#### Scenario: 建立新對話
- **WHEN** 已登入 client 建立新的市場研究對話
- **THEN** 系統 SHALL 建立 user-scoped conversation，並回傳 conversation id 與初始摘要

#### Scenario: 保存 Copilot session identifier
- **WHEN** 系統建立新的市場研究對話
- **THEN** conversation record SHALL 保存 app-owned stable `copilotSessionId`
- **AND** client MUST NOT 被允許提供或修改該 `copilotSessionId`

#### Scenario: 使用 Copilot session identifier 恢復 runtime session
- **WHEN** 已登入 client 在 conversation 中送出 market research message
- **THEN** 系統 SHALL 使用該 conversation 儲存的 `copilotSessionId` 建立或恢復 Copilot SDK session state
- **AND** 系統 SHALL 在使用 session id 前驗證 conversation ownership

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
系統 SHALL 允許已登入使用者删除自己擁有的市場研究對話及其訊息。删除含有 `copilotSessionId` 的 conversation 時，系統 SHALL 對 app-owned Copilot runtime session state 進行盡力清除。

#### Scenario: 刪除自己的對話
- **WHEN** 已登入 client 刪除自己擁有的 conversation
- **THEN** 系統 SHALL 移除或隱藏該 conversation 與其 messages，使該使用者的對話列表不再顯示它

#### Scenario: 刪除 Copilot session state
- **WHEN** 系統刪除含有 `copilotSessionId` 的 conversation
- **THEN** 系統 SHALL 透過共用 Copilot runtime 嘗試删除對應的 app-owned Copilot session state
- **AND** client MUST NOT 直接指定或操作 Copilot session id

#### Scenario: Copilot session cleanup 失敗
- **WHEN** app-owned conversation/messages 删除成功，但 Copilot session cleanup 失敗
- **THEN** 系統 SHALL 記錄 cleanup 失敗
- **AND** 系統 SHALL NOT 還原已删除的 app-owned conversation 或 messages

#### Scenario: 拒絕刪除其他使用者對話
- **WHEN** 已登入 client 嘗試刪除不屬於自己的 conversation
- **THEN** 系統 SHALL 回傳 not found 或 forbidden response，且 MUST NOT 修改其他使用者資料
