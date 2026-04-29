## Why

目前研究助理 drawer 將對話列表、輸入框、進度與 thread 內容放在同一個畫面，資訊層級混雜，使用者開啟後也會直接進入最近對話而非先掌握所有對話紀錄。既然 conversation persistence 已存在，前端需要轉成更接近主流 agent chat 的 session-first navigation：先列表、再進入單一 session，並將 composer 固定在 session 底部。

## What Changes

- 研究助理開啟後，已登入使用者優先看到 conversation list，而不是直接載入並顯示最近 thread。
- 使用者選擇 conversation 後進入單一 session view；session header 提供返回列表的操作。
- 新建 conversation 後進入該 conversation 的 session view，後續送出問題都附加到目前 session。
- Session view 將訊息 thread 作為主要可捲動區域，輸入 composer 固定在底部。
- 保留既有登入 gate、conversation create/select/delete、streaming progress、failed state、structured answer rendering 與 follow-up question 行為。
- Composer 預留助理模式擴充入口；第一版僅顯示單一「研究」模式，不改後端 request contract，不引入 slash command parser。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `agent-conversations`: 明確要求 Web 研究助理以 list view 與 session view 兩層呈現 conversation，並支援 session 返回列表、建立後進入 session、刪除後回到合理狀態。
- `market-research-agent`: 調整 Web assistant panel 行為，要求 session composer 置底，並預留單一研究模式的助理擴充入口但不改 agent execution semantics。

## Impact

- Affected frontend code:
  - `apps/web/src/app/layout/research-assistant/research-assistant.component.ts`
  - `apps/web/src/app/layout/research-assistant/research-assistant.component.html`
  - `apps/web/src/app/layout/research-assistant/research-assistant.component.scss`
  - `apps/web/src/app/layout/research-assistant/research-assistant.component.spec.ts`
- Existing frontend service/API contracts can remain unchanged:
  - `AgentConversationService` already supports list, create, detail, delete, and conversation-scoped streaming.
  - Backend conversation endpoints do not need new fields for the first version.
- No database migration, backend API change, dependency change, or Copilot prompt/runtime change is expected for this change.
