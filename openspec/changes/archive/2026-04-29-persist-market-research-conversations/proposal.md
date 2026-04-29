## Why

FormoAtlas 已要求使用者登入後才能使用市場研究助理，但助理目前仍是單輪互動，回答只存在前端 runtime state，頁面重新整理後即消失。既然使用者身份已存在，研究助理應保存 user-scoped 對話紀錄，讓使用者能回到先前的市場研究脈絡。

## What Changes

- 新增登入使用者的市場研究對話紀錄：conversation list、conversation detail、message history、刪除或封存對話。
- 新增 conversation-scoped streaming query API，將 user question、assistant final answer、failed answer state 與每則 message 的 date/context 保存到 MongoDB。
- 前端研究助理 panel 從單一 answer state 升級為 thread UI，重新整理後可恢復最近開啟的對話。
- 第一版只做對話保存與恢復，不把完整歷史作為 agent memory；資料模型預留未來多輪 follow-up context。
- 不長期保存完整 streaming progress events；progress events 仍只作為當次 runtime UX。
- 保留既有市場資料 read-only tool 與 structured answer contract。

## Capabilities

### New Capabilities
- `agent-conversations`: 登入使用者的市場研究對話、訊息保存、重新載入、刪除與失敗訊息記錄。

### Modified Capabilities
- `market-research-agent`: 新增 conversation-scoped streaming query 行為，讓 agent 回答可附著在使用者對話中保存。

## Impact

- Backend：新增 NestJS conversation/message schema、service、controller routes，並在 agent streaming flow 中寫入 user-scoped messages。
- Frontend：新增 conversation models/service，調整 research assistant panel 為 thread/message UI，並在 auth init 後載入最近對話。
- MongoDB：新增 `agent_conversations` 與 `agent_messages` collections，以及 user/conversation/date 相關索引。
- API：新增受 JWT guard 保護的 conversation endpoints；既有單輪 endpoint 可保留供相容與測試使用。
