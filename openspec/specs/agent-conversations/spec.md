## Purpose

定義 FormoAtlas 登入使用者的市場研究對話、訊息保存、重新載入、刪除與失敗訊息記錄。

## Requirements

### Requirement: 使用者市場研究對話列表
系統 SHALL 為已登入使用者保存市場研究對話，並只讓使用者讀取自己的對話列表。

#### Scenario: 載入使用者對話列表
- **WHEN** 已登入 client 請求市場研究對話列表
- **THEN** 系統 SHALL 回傳該使用者擁有的對話摘要，並依 `lastMessageAt` 由新到舊排序

#### Scenario: 未登入載入對話列表
- **WHEN** 未登入 client 請求市場研究對話列表
- **THEN** 系統 SHALL 回傳 401，且 MUST NOT 回傳任何對話資料

#### Scenario: 對話摘要不包含完整訊息內容
- **WHEN** 系統回傳市場研究對話列表
- **THEN** 每個摘要 SHALL 包含 conversation id、title、message count、last message time 與選填 context snapshot，但 MUST NOT 包含完整 message history

### Requirement: 建立與恢復市場研究對話
系統 SHALL 允許已登入使用者建立市場研究對話，並載入該使用者擁有的對話詳情與訊息歷史。

#### Scenario: 建立新對話
- **WHEN** 已登入 client 建立新的市場研究對話
- **THEN** 系統 SHALL 建立 user-scoped conversation，並回傳 conversation id 與初始摘要

#### Scenario: 保存 Copilot session identifier
- **WHEN** 系統建立新的市場研究對話
- **THEN** conversation record SHALL 保存 app-owned stable `copilotSessionId`，用於未來啟用 Copilot SDK session persistence

#### Scenario: 載入對話詳情
- **WHEN** 已登入 client 請求自己擁有的 conversation detail
- **THEN** 系統 SHALL 回傳 conversation metadata 與該 conversation 的 messages

#### Scenario: 拒絕讀取其他使用者對話
- **WHEN** 已登入 client 請求不屬於自己的 conversation detail
- **THEN** 系統 SHALL 回傳 not found 或 forbidden response，且 MUST NOT 暴露該 conversation 是否存在於其他使用者帳號下

#### Scenario: 重新整理後恢復最近對話
- **WHEN** 已登入 web app 初始化研究助理狀態
- **THEN** web app SHALL 載入最近的 conversation summary，並可恢復最近開啟或最近更新的 thread

### Requirement: 對話訊息保存
系統 SHALL 在 conversation-scoped agent query 中保存 user message 與 assistant message。

#### Scenario: 保存使用者問題
- **WHEN** 已登入 client 在 conversation 中送出有效市場研究問題
- **THEN** 系統 SHALL 在呼叫 agent 前保存一則 user message，包含 question、date 與提交當下的 context

#### Scenario: 保存助理成功回答
- **WHEN** agent 產生 validated structured answer
- **THEN** 系統 SHALL 保存一則 completed assistant message，包含 structured answer、date、context 與 completion timestamp

#### Scenario: 保存助理失敗狀態
- **WHEN** agent execution、tool execution、Copilot 呼叫或 response validation 最終失敗
- **THEN** 系統 SHALL 保存一則 failed assistant message，包含可呈現的 error message 與相關 date/context

#### Scenario: 不長期保存完整進度事件
- **WHEN** conversation-scoped streaming query 產生 status、tool_start 或 tool_result events
- **THEN** 系統 SHALL 將 events 傳給 client 作為 runtime progress，且 MUST NOT 要求完整 progress events 保存為長期 conversation record

### Requirement: Message Context Snapshot
系統 SHALL 以 message 為單位保存市場研究脈絡，使跨頁對話仍可追溯每次回答的資料基準。

#### Scenario: 保存日期脈絡
- **WHEN** user message 被保存
- **THEN** message SHALL 保存該問題使用的 selected date

#### Scenario: 保存頁面脈絡
- **WHEN** user message 包含 route、market、symbol 或 sector context
- **THEN** message SHALL 保存提交當下的 context snapshot

#### Scenario: 跨頁延續對話
- **WHEN** 使用者在同一 conversation 中從不同頁面送出問題
- **THEN** 系統 SHALL 將新 message 附加到同一 conversation，並以 message-level context 區分每次問題的市場脈絡

### Requirement: 刪除使用者對話
系統 SHALL 允許已登入使用者刪除自己擁有的市場研究對話及其訊息。

#### Scenario: 刪除自己的對話
- **WHEN** 已登入 client 刪除自己擁有的 conversation
- **THEN** 系統 SHALL 移除或隱藏該 conversation 與其 messages，使該使用者的對話列表不再顯示它

#### Scenario: 刪除保留未來 session cleanup 邊界
- **WHEN** 系統刪除含有 `copilotSessionId` 的 conversation
- **THEN** 系統 SHALL 以 conversation ownership 為邊界刪除 app-owned conversation/messages，且 MUST NOT 讓 client 直接指定或操作 Copilot session id

#### Scenario: 拒絕刪除其他使用者對話
- **WHEN** 已登入 client 嘗試刪除不屬於自己的 conversation
- **THEN** 系統 SHALL 回傳 not found 或 forbidden response，且 MUST NOT 修改其他使用者資料

### Requirement: Web 研究助理 Thread UI
web app SHALL 將研究助理呈現為可載入、切換與恢復的 conversation thread，而不是只顯示單一 ephemeral answer。

#### Scenario: 顯示訊息歷史
- **WHEN** web app 載入 conversation detail
- **THEN** research assistant panel SHALL 顯示 user messages、completed assistant answers 與 failed assistant states

#### Scenario: 建立新對話
- **WHEN** 使用者在研究助理 panel 選擇新對話
- **THEN** web app SHALL 建立新的 conversation，並將後續問題送入該 thread

#### Scenario: 切換對話
- **WHEN** 使用者從對話列表選擇另一個 conversation
- **THEN** web app SHALL 載入並呈現該 conversation 的 messages

#### Scenario: 刪除對話後更新 UI
- **WHEN** 使用者刪除目前 conversation
- **THEN** web app SHALL 從列表移除該 conversation，並切換到另一個可用 conversation 或空狀態
