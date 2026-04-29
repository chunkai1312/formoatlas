## Context

研究助理已經有 authenticated conversation persistence：前端 `AgentConversationService` 可載入列表、建立對話、載入 detail、刪除對話，並透過 conversation-scoped streaming endpoint 將訊息保存到目前 conversation。現行 drawer UI 仍沿用早期 panel 形狀，把 conversation list、question box、progress events 與 thread messages 放在同一個垂直畫面，且初始化時會載入最近 conversation detail。

這造成兩個產品問題：

- 開啟助理時，使用者無法先掃描所有歷史對話，必須在同一個狹窄 drawer 內同時處理列表與 thread。
- 輸入框位於 thread 之前，不符合主流 chat/agent session 介面的閱讀與輸入動線。

第一版改善應聚焦在前端資訊架構，沿用既有 API 與資料模型。

## Goals / Non-Goals

**Goals:**

- 將研究助理 drawer 拆成 list view 與 session view。
- 已登入使用者開啟 drawer 時先看到 conversation list。
- 選擇或建立 conversation 後進入 session view。
- Session view 支援返回 list。
- Session view 中 thread 區域可捲動，composer 固定在底部。
- 保留既有 structured answer、evidence、warnings、follow-up、streaming progress 與 error handling。
- 在 composer 中預留單一「研究」模式入口，讓未來擴充不同助理或 slash command 時不需要重排主要 layout。

**Non-Goals:**

- 不修改 backend conversation API、database schema 或 message shape。
- 不新增真正的多助理 backend contract。
- 不新增 slash command parser。
- 不啟用 multi-turn memory replay 或 Copilot session persistence。
- 不新增 pin、archive、search、rename、fork、export 或 public share link。
- 不實作 desktop side-by-side layout；第一版使用 compact navigation flow。

## Decisions

### Decision 1: Drawer 使用 `list` / `session` View State

**選擇：** 在 `ResearchAssistantComponent` 內新增明確 view state，例如 `assistantView = signal<'list' | 'session'>('list')`。開啟 drawer 時，已登入使用者載入 conversation summaries 並停留在 list view；選擇 detail 或建立 conversation 後切到 session view。

**原因：** 這是最小且直接的資訊架構調整。後端資料模型已經區分 summary 與 detail，前端 view state 對應這個資料層級即可，不需要 route 或 API 變更。

**替代方案：** 讓列表與 thread 在同一畫面並排。現有 drawer 寬度約 440px，並排會壓縮 thread 與 answer cards，mobile 也仍需要 compact flow。第一版先採 compact flow，未來若 drawer 擴成全高工作區再考慮 side-by-side。

### Decision 2: Open 不自動進入最近 Session

**選擇：** 開啟 drawer 時只載入 conversation list，不自動 `loadDetail(first.id)` 進入最近 conversation。若 service 已有 current conversation，可仍保留資料在記憶體中，但 UI 預設顯示 list。

**原因：** 使用者需求是「首先進入看到所有對話紀錄清單」。自動進最近 session 會讓 list-first 模型失效，也會讓使用者以為助理永遠綁定最近 thread。

**替代方案：** 開啟後進最近 session，並提供返回列表。這符合部分 chat app 行為，但不符合本次改善目標。

### Decision 3: New Conversation 直接進入 Session

**選擇：** 使用者按「新對話」後建立 conversation、載入 detail，並切換到 session view。若無對話時，也應提供可開始新 session 的空狀態。

**原因：** 新建對話是明確開始工作流，直接進入 session 可讓使用者立即輸入第一個問題。

**替代方案：** 新建後留在列表並插入一筆空對話。這會讓使用者多一次點選，也容易產生空 conversation 噪音。

### Decision 4: Session Composer 固定在底部，輸入區佔滿寬度

**選擇：** Session view 採 flex column：header 固定在上方、thread scroll area 佔滿剩餘高度、composer 固定在底部。Composer 本身採上下兩層：textarea 作為 full-width 主體，下方 action row 放單一「研究」mode affordance 與送出按鈕。Progress events 顯示在 thread 底部附近或 composer 上方，不應把 composer 推離底部。

**原因：** Chat/agent session 的主要操作是讀完最新訊息後在底部接續輸入。置底 composer 能減少視線跳動，也更符合手機與桌面常見模式。Drawer 寬度有限，若 mode、textarea、submit button 三欄水平排列，textarea 會被壓縮；讓 textarea 佔滿寬度可以保留足夠的中文輸入空間。

**替代方案：** 保持現有 composer 在 thread 之前，或使用 mode、textarea、submit button 三欄水平排列。前者讓使用者每次閱讀歷史訊息後都需要回到上方輸入，尤其長答案時體驗較差；後者在窄 drawer 內會讓 textarea 過窄。

### Decision 5: 第一版只做單一 Mode Affordance

**選擇：** Composer 可顯示單一「研究」模式控制或標籤，但不改送出的 request payload，不解析 slash command，也不提供多個可選模式。

**原因：** 目前只有一個市場研究助理，先在 layout 上保留擴充位置即可。真正多助理會影響 request contract、prompt、tool policy 與測試，不應混入這個 UI navigation change。

**替代方案：** 直接加入模式切換或 slash commands。這會讓 UI 看起來更完整，但沒有 backend 行為支撐時容易造成假 affordance。

## Risks / Trade-offs

- **使用者想直接回到上次 session** -> 先以 list-first 滿足本次需求；未來可在列表第一筆高亮最近 conversation 或提供「繼續最近對話」快捷。
- **已有 current conversation 但 UI 顯示 list 可能造成狀態混淆** -> View state 成為畫面 truth；current conversation 只是 loaded detail cache。
- **Progress events 位置改動可能降低可見性** -> 在 session view 的最新訊息附近或 composer 上方保留 progress 區塊，並確保 loading 時送出按鈕 disabled。
- **置底 composer 與 mobile viewport 高度衝突** -> 使用 fixed-height/flex constraints，thread area 使用 `min-height: 0` 與 overflow，避免整個 drawer 雙重滾動。
- **Mode affordance 被誤解為可切換助理** -> 第一版顯示為單一不可展開或單選狀態，文案使用「研究」而非多助理名稱。
