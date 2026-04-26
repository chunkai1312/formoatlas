## 背景

晴雨表服務目前在 `BarometerService.generateAnalysis()` 中透過 LangChain 呼叫 OpenAI。服務依賴 LangChain 提供 chat message wrapper 與 Zod-backed structured output，然後將產生的 `{ level, weather, label, summary }` 快取到 `MarketStats.aiAnalysis`。

這次替換會保持公開 API 與領域行為不變，但將模型呼叫移到 GitHub Copilot SDK。後端會一律透過 `COPILOT_CLI_URL` 連線至獨立常駐的 Copilot CLI headless server，由 CLI process 使用 `COPILOT_GITHUB_TOKEN` 認證並消耗維護者的 Copilot 請求額度。

## 目標 / 非目標

**目標：**

- 以 `@github/copilot-sdk` 取代 LangChain/OpenAI 依賴。
- 所有環境都使用 `COPILOT_CLI_URL` 連線至 Copilot CLI headless server，將 token 邊界留在 CLI process。
- API process 不讀取 `COPILOT_GITHUB_TOKEN`，也不使用 auto-managed bundled CLI fallback。
- 保留既有 prompt 內容、輸出 schema 驗證、快取語義與 HTTP response 行為。
- 將整合範圍限制在晴雨表摘要的單輪文字生成。

**非目標：**

- 不新增互動式聊天、多輪 session、MCP server、custom tool 或 agent delegation。
- 不改變晴雨表 API response shape 或前端行為。
- 不在此變更中新增多 provider abstraction 或 OpenAI fallback。
- 不改變市場資料收集或技術指標計算邏輯。

## 技術決策

### 一律使用 Headless Mode

服務會以 `COPILOT_CLI_URL` 建立 `CopilotClient`，連線到獨立常駐的 Copilot CLI headless server。這讓 API process 不需要管理 CLI server lifecycle，也讓 token 可集中在 CLI process/container。

曾考慮的替代方案：保留 SDK auto-managed bundled CLI 作為 local fallback。這對 local dev 方便，但會讓不同環境有不同 runtime path，且把 token 帶回 API process；因此改為所有環境一致要求 headless server。

### 在晴雨表服務中直接使用 Copilot SDK

服務會為晴雨表 LLM 呼叫建立 Copilot session，並送出包含既有 system prompt 與 user message 的單一 prompt。這讓 code path 接近目前實作，並避免在只有一個 active provider 時過早引入 abstraction。

曾考慮的替代方案：導入支援多 provider 的 `BarometerAnalysisProvider`。這對長期 fallback 行為較乾淨，但使用者要求的範圍是直接替換。

### 使用既有 Zod schema 驗證 Copilot 文字回應

Copilot SDK 回傳 assistant text content，而不是 LangChain-style structured object。服務會要求 JSON response，抽取並解析 JSON，使用 `BarometerOutputSchema` 驗證，並將無效輸出視為 LLM failure。

曾考慮的替代方案：只依賴 prompt 要求 JSON 格式。這可以減少程式碼，但會削弱既有 structured-output guarantee。

### 無效結構化輸出只重試一次

當 Copilot 回傳無法解析的 JSON 或不符合 schema 的 JSON 時，服務會重試一次。retry prompt 會包含無效回應，並要求只回傳必要 JSON object。network 或 SDK error 會直接走既有 503 path。

曾考慮的替代方案：不重試。單次重試成本小，能從偶發 formatting drift 中恢復，同時仍限制 Copilot request 使用量。

### 此 workflow 避免使用 Copilot tools

session 會設定為純文字分析，且不主動暴露 custom tools。晴雨表 prompt 已包含所有必要市場資料，後端不應讓此 workflow 執行 file、git、shell 或 web action。

曾考慮的替代方案：使用 Copilot agent/tool capabilities。這些能力對每日固定分析沒有實質價值，且會增加 server-side token 風險。

## 風險 / 取捨

- Copilot SDK 仍屬 preview-level tooling -> 將整合範圍保持狹窄，並在快取前驗證回應。
- headless CLI server 是額外 runtime dependency -> 所有環境都需要先啟動 CLI server；production 需要替 CLI server 設定 restart policy 與 health check。
- SDK 與 headless CLI 之間沒有內建網路認證 -> 將 `COPILOT_CLI_URL` 限制在同主機、container network、private network 或 VPC 內。
- Copilot request quota 與 rate limit 可能中斷排程分析 -> 保留既有 503 行為，失敗時不寫入快取。
- JSON parsing 取代 LangChain structured output -> 使用 Zod validation 加上一次 bounded retry。
- server-side token 誤用可能消耗維護者的 Copilot 額度 -> 維持 cache-first workflow，避免 tool-based agent behavior。
- runtime packaging 可能比 LangChain 更重 -> dependency 變更後驗證 API build 與 package installation。

## 遷移計畫

1. 新增 `@github/copilot-sdk`，並移除 LangChain dependencies。
2. 將晴雨表 LLM 呼叫替換為 Copilot SDK 呼叫，並使用 `COPILOT_CLI_URL` 連線 headless CLI。
3. 移除 API process 的 `COPILOT_GITHUB_TOKEN` fallback。
4. 將 `.env.example` 與 README 從 `OPENAI_API_KEY` 更新為 `COPILOT_CLI_URL`，並說明 token 放在 headless CLI process。
5. 驗證 build/test 行為。

rollback 方式是 revert 此變更，並恢復 LangChain dependencies 與 `OPENAI_API_KEY`。
