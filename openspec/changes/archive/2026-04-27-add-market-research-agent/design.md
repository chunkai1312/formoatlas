## Context

FormoAtlas 已經以選取交易日作為市場脈絡中心，並透過 NestJS REST endpoints 暴露相關資料。目前 Copilot 整合刻意維持狹窄：`BarometerService` 使用單輪 Copilot SDK 呼叫、拒絕 tools、驗證 JSON，並將結果快取在 `MarketStats.aiAnalysis`。

市場研究 agent 是另一條互動式 workflow。它應該使用同一個 Copilot CLI headless server，但不同於排程晴雨表摘要，它可以呼叫一小組 read-only market data tools。agent 必須被限制在 FormoAtlas 領域資料內，不應變成泛用的 server-side coding、shell、web 或 file agent。

## Goals / Non-Goals

**Goals:**

- 新增單輪互動式市場研究 API，接受使用者問題以及選取日期/頁面脈絡。
- 讓 Copilot 呼叫 allowlisted、read-only market data tools，資料來源為既有 repositories 與 services。
- 回傳適合在精簡助理 panel 中呈現的結構化、具證據引用答案。
- 透過 SSE/status events 在等待期間回報 agent 進度與 tool 狀態，最後仍回傳 validated structured answer。
- 透過 timeout、tool call count、date range 與 schema validation 限制 tool 使用。
- 沿用既有 `COPILOT_CLI_URL` 與 `COPILOT_MODEL` runtime model。

**Non-Goals:**

- 不改變既有晴雨表生成、prompt、cache semantics 或 tool-denial policy。
- 不新增交易、投資組合、下單或個人化投資建議能力。
- 不向 runtime agent 暴露 generic file、shell、git、web browsing 或 MCP tools。
- MVP 不引入長期聊天記憶或已儲存對話。
- MVP 不新增外部資料來源。
- MVP 不做 raw token-by-token answer streaming。

## Decisions

### 新增獨立 Agent Module

新增 backend module 承載市場研究 agent，而不是擴充 `BarometerService`。

理由：晴雨表 workflow 是排程、cache-first，且需要針對固定分析產生穩定 JSON。研究 agent 則是互動式、query-driven、tool-enabled。將兩者分離，可以避免 agent policy 變更削弱既有晴雨表路徑。

曾考慮的替代方案：在 `BarometerService` 加入選填 `interactive` mode。這會混合兩種不同可靠性模型，也更容易意外讓排程摘要路徑取得 tools。

### 第一版使用單輪 Query

第一版接受一個問題與頁面脈絡，回傳一個結構化答案。

理由：單輪互動可以先驗證產品價值，同時避開 session persistence、memory trimming、conversation replay 與跨 request quota 控制。選取日期、目前 route、market tab 與選填 symbol 已足以回答有用的市場問題。

曾考慮的替代方案：完整多輪 chat sessions。這對後續有價值，但在 agent 核心 usefulness 被驗證前，會增加 storage、privacy、stale-context 與 UI 複雜度。

### 只暴露 Read-Only Domain Tools

定義 Copilot SDK tools 讀取既有 FormoAtlas 資料：

- `get_market_stats_range(startDate, endDate)`
- `get_barometer(date)`
- `get_sector_flow(date, market)`
- `get_hot_stocks(date, market)`
- `get_ticker_ohlc(symbol, startDate, endDate)`

理由：這些 tools 直接對應既有 APIs/repositories，能讓 agent 被可稽核的市場資料 grounded。tool descriptions 應註明輸出是歷史/盤後資料，不是交易指令。

曾考慮的替代方案：給 agent HTTP/web access 或 generic database query tool。這會增加覆蓋範圍，但也帶來可避免的安全、正確性與 quota 風險。

### 要求結構化 Agent Output

agent response 在回傳 web app 前應先 parse 並以 Zod schema 驗證。response shape 應包含：

- `summary`：精簡答案文字
- `keyFindings`：具證據支撐的短發現
- `evidence`：source references，包含 tool/source type、相關 date/range、market/symbol 與短 label
- `followUpQuestions`：建議追問問題
- `warnings`：選填限制，例如資料缺漏或查詢範圍過廣

理由：結構化 output 讓 frontend 能呈現有用的研究 panel，也讓測試可以驗證行為。evidence references 比自由文字更可信。

曾考慮的替代方案：串流 raw assistant text。這會更像聊天，但 evidence rendering、validation 與 error handling 會較弱。

### 使用 SSE Status Streaming，而不是 Raw Token Streaming

新增 streaming endpoint 以 Server-Sent Events 回傳 agent 執行狀態。事件應聚焦在產品可理解的狀態，例如 `status`、`tool_start`、`tool_result`、`final` 與 `error`。`final` event 必須包含通過 Zod schema 驗證的完整結構化答案。

理由：使用者不應在 agent 查詢與 tool execution 期間面對空白 loading state；但市場研究 agent 的可信度核心是 evidence-backed、validated structured output。SSE progress streaming 可以改善等待體驗，同時保留最後答案的 schema validation 與 evidence rendering。

曾考慮的替代方案：直接串流模型 token。這能提供更像聊天的體驗，但 token stream 在最終 JSON 尚未完成前不可驗證，容易造成前端先顯示未驗證內容，並讓 evidence 與 warnings 的一致性變差。

### 套用 Agent Policy Limits

agent service 應限制執行範圍：

- 拒絕空白或過長問題
- 限制 range tools 的 date range
- 限制每個 request 的 tool calls
- 設定總 request timeout
- 拒絕 allowlisted tools 以外的 permission requests
- Copilot/headless CLI 失敗或 output validation 在 bounded retry 後仍失敗時，回傳可預期的 service error

理由：Copilot headless server 承載維護者 quota 與 token 邊界。policy limits 可降低失控成本並讓 agent 行為可預期。

曾考慮的替代方案：只依賴 prompt instructions。prompt-only controls 不足以保護 server-side quota 與 tool safety。

### 以 Shared Assistant Panel 呈現

新增 Angular research assistant panel 或 drawer，可從既有頁面開啟。它應使用目前全域 selected date，並包含 route-level context，例如 dashboard、sector flow、hot stocks、active market 與 selected symbol。

理由：agent 應增強既有市場視圖，而不是變成獨立 landing page。使用者可以一邊檢視圖表/表格，一邊提出問題，且不會丟失脈絡。

曾考慮的替代方案：建立獨立 `/agent` 頁面。這較簡單，但會削弱與目前市場視圖綁定的脈絡化問題價值。

## Risks / Trade-offs

- Copilot output 可能 hallucinate 或過度推論因果 -> 要求結構化 evidence，並指示 agent 區分資料支持的觀察與解讀。
- Headless CLI 或 Copilot quota 在互動時可能失敗 -> 回傳清楚的 unavailable/error state，且不阻塞既有 dashboard pages。
- Tool-enabled sessions 可能提高成本 -> 限制 tool calls、timeouts、question length 與 date range。
- Streaming 可能讓前端狀態處理更複雜 -> 限制事件型別，且只在 `final` event 呈現正式答案。
- agent 可能被要求回答類似投資建議的問題 -> system instructions 與 UI/API copy 應表明回答是市場資料分析，不是個人化建議或交易指令。
- 單輪 MVP 可能較不像對話 -> 使用 suggested follow-up questions 保留流動感，但暫不加入 persistence。
- Evidence references 初期可能無法完美對應 UI navigation -> 先包含穩定 source/date/market/symbol metadata，之後再加入可點擊 evidence。

## Migration Plan

1. 新增 backend agent module 與 endpoint，不改變既有 marketdata 或 barometer endpoints。
2. 在既有 repository/service methods 外包一層 read-only tool wrappers。
3. 新增 structured response validation 與 bounded retry/error handling。
4. 新增 SSE/status streaming endpoint 與 web streaming consumer。
5. 新增 web assistant panel，並串接 selected date/page context。
6. 驗證 backend 與 frontend build/test。

Rollback：移除新的 agent route/module 與 web panel。由於 agent workflow 隔離，既有 barometer 與 marketdata 行為不受影響。

## Open Questions

- MVP 是否應保存匿名 query logs 以便產品除錯，或所有 queries 都保持 ephemeral？
- 第一個 UI 入口應放在 global toolbar、per-page floating action，還是 desktop 的右側固定 panel？
- 是否保留 non-streaming endpoint 作為測試與 fallback 路徑，或讓 panel 一律使用 streaming endpoint？
