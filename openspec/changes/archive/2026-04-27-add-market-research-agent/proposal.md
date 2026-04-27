## Why

FormoAtlas 目前透過固定儀表板與排程產生的晴雨表摘要解讀市場資料，但使用者無法跨大盤廣度、資金流向、熱門個股與 ticker 歷史資料提出脈絡化追問。新增 read-only 市場研究 agent，可以把既有日期導向資料模型轉化為互動式研究助理，同時將 Copilot 存取範圍限制在可信任的領域資料內。

## What Changes

- 新增互動式市場研究 agent，回答使用者針對選取日期與選填頁面脈絡提出的台股市場問題。
- 新增單輪 agent query API endpoint，透過既有 Copilot CLI headless server 與 GitHub Copilot SDK 執行。
- 僅提供 read-only market data tools 給 agent 使用，工具資料來源來自既有 repository/service，例如 market stats、barometer、sector flow、hot stocks 與 ticker OHLC。
- 回傳結構化答案，包含精簡摘要、重點發現、證據引用與建議追問問題。
- 新增 SSE/status event streaming，讓 client 在 agent 查詢期間收到進度與 tool 狀態，最後仍以 validated structured answer 結束。
- 在既有市場頁面加入 web 研究助理 panel 或 drawer，送出使用者問題時一併帶入選取日期與頁面脈絡。
- 保留既有晴雨表生成流程不變，排程晴雨表摘要仍然拒絕 tools。

## Capabilities

### New Capabilities

- `market-research-agent`：針對既有 FormoAtlas 市場資料提供互動式、具證據引用的市場研究問答。

### Modified Capabilities

- 無。

## Impact

- Backend：新增 NestJS agent module/controller/service、Copilot SDK session orchestration、read-only domain tool definitions、DTO、SSE streaming endpoint、Zod response validation，以及 tool 使用/timeout 的 policy limits。
- Frontend：新增 Angular 研究助理 panel/drawer、agent query/streaming 的 core service/model types，並從既有 dashboard、sector flow、hot stocks routes 串接頁面與日期脈絡。
- Runtime：繼續要求 `COPILOT_CLI_URL` 與 `COPILOT_MODEL`；不引入 write-capable 或 generic runtime tools。
- Data：使用既有 MongoDB market data 與 cached barometer output；MVP 不需要 schema migration，除非後續明確加入 query logging。
