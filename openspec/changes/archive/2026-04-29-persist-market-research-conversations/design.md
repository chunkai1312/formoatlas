## Context

FormoAtlas 的市場研究助理目前是 authenticated single-turn workflow。Angular panel 只保存當次 `question`、`answer` 與 streaming progress signals；NestJS `MarketResearchAgentController` 接受 `{ question, date, context }`，建立 Copilot SDK session，使用 read-only market data tools，最後回傳 validated structured answer。這個設計刻意避開長期 session persistence，但現在 Google OAuth、JWT cookie 與 `JwtAuthGuard` 已存在，助理的使用者身份邊界已足以支援 user-scoped conversation history。

既有 `User` schema 已嵌入 `watchList`，但 agent conversations 與 watch list 不同：對話會持續成長、需要列表分頁、刪除、按最近時間排序，且每則訊息有自己的 date/context/answer/error 狀態。因此本 change 應新增獨立 conversation/message documents，而不是把歷史塞進 user document。

## Goals / Non-Goals

**Goals:**

- 讓已登入使用者的市場研究對話在重新整理或重新登入後仍可載入。
- 新增 conversation list/detail/delete APIs，全部受 `JwtAuthGuard` 保護並強制 user ownership。
- 新增 conversation-scoped streaming query，將 user message、assistant completed answer 或 failed state 寫入 MongoDB。
- 每則 message 保存當時的 selected date 與 route/market/symbol/sector context，讓跨頁對話仍可追溯答案脈絡。
- 前端 research assistant panel 改為 thread/message model，並在 auth 初始化後恢復最近開啟的 thread。
- 保留既有 structured answer、evidence、warnings 與 read-only tool safety policy。

**Non-Goals:**

- 第一版不把完整 conversation history 注入 prompt 作為 agent memory。
- 第一版不保存完整 streaming progress events 作為長期資料。
- 不新增匿名對話保存；未登入使用者仍只能看到 auth gate。
- 不新增 shareable public conversation links、export、search 或 retention policy。
- 不變更 Copilot provider、tool allowlist、投資建議限制或市場資料來源。

## Decisions

### Decision 1: 使用獨立 Conversation 與 Message Collections

**選擇：** 新增 `agent_conversations` 與 `agent_messages` collections。

建議 document shape：

```text
agent_conversations
  _id
  userId
  copilotSessionId
  title
  contextSnapshot
  messageCount
  lastMessageAt
  archivedAt?
  createdAt
  updatedAt

agent_messages
  _id
  userId
  conversationId
  role: user | assistant
  status: completed | failed
  question?
  answer?
  date
  context
  error?
  createdAt
  completedAt?
```

**原因：** 對話資料會隨使用成長，需要依 user/time 查詢、刪除 conversation 時批次刪 message、未來也可能支援 pagination/search。獨立 collections 比嵌入 `User` 更適合成長型資料。

**替代方案：** 嵌入 `User.conversations[]`。這對少量設定資料簡單，但長期會讓 user document 膨脹，也不利於 message-level pagination 與刪除。

### Decision 1a: 保存 Copilot Session Identifier 但不啟用 Resume

**選擇：** `agent_conversations` 保存 `copilotSessionId`，格式為由 app 控制的穩定 id，例如 `formoatlas:user:<userId>:conversation:<conversationId>`。第一版只保存 identifier，不呼叫 Copilot SDK `resumeSession()`，也不把完整歷史交給 Copilot runtime。

**原因：** GitHub Copilot SDK 官方 session persistence 適合保存 agent runtime history，但它不是 FormoAtlas 的產品資料庫。先保存 `copilotSessionId` 能保留未來啟用 `resumeSession()` 與 `deleteSession()` 的路徑，同時不擴大本 change 的多輪 memory、concurrency lock、persistent volume 與 shared CLI access-control 範圍。

**替代方案：** 立即用 Copilot SDK session persistence 取代 app-level message history。這會讓 UI 列表、user ownership、structured answer re-render、failed state 與刪除語意依賴 Copilot session store，不適合作為產品資料來源。

### Decision 2: 對話跨頁共用，Message 保存 Context Snapshot

**選擇：** conversation 不綁定單一 route；每則 message 保存提交當下的 `date` 與 `context`。

**原因：** 使用者研究市場時可能從首頁問大盤，再切到類股或熱門股追問。把 route/date 放在 message 層可保留每次回答的資料依據，也不限制 conversation 的自然流動。

**替代方案：** 每個 route/date 自動建立不同 conversation。這能降低脈絡混雜，但行為不透明，使用者切頁後容易找不到剛才的問題。

### Decision 3: Conversation-Scoped Streaming 負責 Persistence

**選擇：** 新增 `POST /api/agent/conversations/:id/messages/stream`。該 endpoint 會先建立 user message，再執行既有 agent query，最後建立 completed 或 failed assistant message。

流程：

```text
client submit
  -> validate conversation ownership
  -> persist user message
  -> run MarketResearchAgentService.query(body, emit)
  -> persist assistant message as completed(final answer) or failed(error)
  -> update conversation lastMessageAt/messageCount/title
```

**原因：** persistence 應與 conversation-scoped request 綁定，避免前端需要在 final event 後再呼叫另一個 save API，造成回答已顯示但保存失敗的不一致。

**替代方案：** 讓前端收到 final 後呼叫 `POST /messages` 保存。這比較容易加在現有 UI 上，但會讓資料一致性依賴 client，且重新整理/斷線時容易遺失 final answer。

### Decision 4: 保留既有 Single-Turn Endpoint

**選擇：** 既有 `/api/agent/market-research` 與 `/api/agent/market-research/stream` 可保留作為相容與測試路徑；新的 UI 預設使用 conversation-scoped endpoint。

**原因：** 現有 tests、service contract 與 fallback 可以維持穩定。conversation persistence 是新產品行為，不需要破壞原本的單輪 API。

**替代方案：** 直接改造既有 endpoint 使其必須帶 `conversationId`。這會讓 API contract 更單一，但造成較大破壞面，也削弱單輪 service 測試的簡潔性。

### Decision 5: 第一版不做 Agent Memory Replay

**選擇：** 第一版只保存與恢復對話，不把完整歷史注入 Copilot prompt，也不 resume persisted Copilot session。資料模型預留 conversation/message history 與 `copilotSessionId`，未來可加入最近 N 輪 compact replay 或 Copilot SDK session persistence。

**原因：** 使用者目前的痛點是重新整理後紀錄消失。把歷史注入 prompt 會同時引入 token cost、stale context、隱私與答案品質風險。先完成 reliable persistence，可以獨立驗證 UX 價值。

**替代方案：** 立即支援完整多輪 memory 或 Copilot `resumeSession()`。這看起來更像聊天，但容易讓 agent 混用不同日期或不同頁面 context，且需要更嚴格的 trimming/summary policy、session locking、session deletion 與 deployment storage policy。

### Decision 6: 不長期保存 Progress Events

**選擇：** SSE progress events 只保留在當次 client runtime；MongoDB 只保存 final structured answer、failed error、timestamps 與 message metadata。

**原因：** Progress events 是等待體驗，不是研究紀錄。長期保存會增加資料量與 schema 噪音，卻不太提升使用者回看價值。

**替代方案：** 保存完整 progress event log。這對 debugging 有幫助，但應留給 server logs 或未來 observability，不應成為產品資料模型的第一版需求。

### Decision 7: 前端以 Current Thread 為主狀態

**選擇：** 新增 `AgentConversationService` 管理 conversation list、current conversation、messages 與 send streaming message。Research assistant panel 顯示目前 thread；使用者可建立新對話、切換對話、刪除對話。

**原因：** 目前 component-local `answer` signal 是造成刷新遺失的核心。把資料來源提升到 service，並以 API-loaded messages 為 truth，可以讓 refresh/reopen 行為一致。

**替代方案：** 只把目前 answer 存進 localStorage。這能快速解決 refresh，但不是 user-scoped，跨裝置無效，也不符合已登入後應保存紀錄的產品方向。

## Risks / Trade-offs

- **資料量成長** -> 第一版建立 user/time indexes，conversation list 只回 summary，detail 才載 messages；未來再加 pagination/retention。
- **斷線時 persistence 與 SSE final 不一致** -> server-side stream endpoint 先寫 user message，final/error 都在 server 寫入 assistant message；client 重新載入 conversation 可看到最終狀態。
- **跨頁 conversation 可能混合不同脈絡** -> 每則 message 顯示 date/context metadata，讓使用者知道答案基於哪個頁面與日期。
- **未做 memory replay 可能讓追問不像真正聊天** -> UI 可先呈現歷史，但 agent 仍依當次 question/date/context 回答；未來以 bounded recent-turn replay 增強。
- **保存 copilotSessionId 但尚未使用可能造成誤解** -> 設計與 spec 明確標示它是 future-compatible identifier，本 change 不 resume Copilot session。
- **刪除 conversation 的資料一致性** -> 刪除或封存 conversation 時必須同時處理 messages；第一版建議 hard delete user-owned conversation/messages。
- **保存使用者問題有隱私含義** -> Conversation endpoints 必須全部受 JWT guard 保護，所有 query 都以 `userId` scope 查詢；提供刪除能力。

## Migration Plan

1. 新增 Mongoose schemas、indexes 與 backend conversation module/service/controller，並在 conversation 建立時保存穩定 `copilotSessionId`。
2. 新增受 guard 保護的 conversation list/detail/create/delete endpoints。
3. 新增 conversation-scoped streaming endpoint，整合既有 `MarketResearchAgentService.query()`。
4. 新增 Angular conversation models/service，讓 panel 從 API 載入 current thread 與 messages。
5. 調整 research assistant UI：conversation list、新對話、thread messages、failed state、delete action。
6. 保留既有 single-turn endpoint 與 tests，新增 backend/frontend tests 覆蓋 ownership、persistence、refresh restore 與 stream final/error 寫入。

Rollback：移除新 UI 路徑並恢復 panel 使用既有 single-turn streaming endpoint；新 collections 可留存不讀取，或在確認無需保留使用者資料後清理。

## Open Questions

- 是否需要 message pagination？第一版可以先限制載入最近一個 conversation 的完整 messages，conversation list 只載 summary。
- 刪除採 hard delete 還是 archive？產品上使用者期待「刪除」即不可見；實作可先 hard delete，若未來需要 audit 再改 archive。
- 是否需要 per-user agent usage quota？本 change 不新增 quota，但 conversation data 可作為未來計算依據。
