## Why

TaiBaro 目前透過 LangChain 直接呼叫 OpenAI API 產生每日晴雨表分析，但維護者已訂閱 GitHub Copilot。將晴雨表 LLM 呼叫改為 Copilot SDK，並一律連線至 Copilot CLI headless server，可讓這個低頻每日分析工作消耗 Copilot 請求額度取代直接 OpenAI API 成本。

## What Changes

- 將晴雨表分析的 LLM 整合由 `@langchain/openai` 與 `@langchain/core` 替換為 `@github/copilot-sdk`。
- 透過 `COPILOT_CLI_URL` 連線至獨立常駐的 Copilot CLI headless server，由 CLI process 持有 `COPILOT_GITHUB_TOKEN`。
- API process 不自行啟動 bundled CLI，也不使用 `COPILOT_GITHUB_TOKEN` 直接認證。
- 保留既有晴雨表 prompt、技術面上下文計算、DB 快取行為、輸出 schema、天氣/標籤對應與 HTTP 錯誤行為。
- 將 Copilot SDK 的文字回應解析為 JSON，使用 `BarometerOutputSchema` 驗證，若回應不是有效結構化輸出則重試一次。
- 移除 LangChain 依賴，並更新 Copilot 分析所需的環境變數文件。

## Capabilities

### New Capabilities

- `barometer-copilot-analysis`: 定義以 Copilot SDK 作為 LLM 提供者，產生結構化每日晴雨表分析的能力。

### Modified Capabilities

- `barometer-analysis`: LLM 提供者需求由透過 LangChain 呼叫 OpenAI API，改為使用 Copilot SDK 並一律透過 `COPILOT_CLI_URL` 連線 headless CLI，同時保留外部 API contract 與快取語義。

## Impact

- 受影響的後端程式：
  - `apps/api/src/app/barometer/barometer.service.ts`
  - `apps/api/src/app/barometer/barometer.schema.ts`（若需要 helper typing）
- 受影響的設定與依賴：
  - `package.json`
  - `package-lock.json`
  - `.env.example`
  - `README.md`
- 執行期影響：
  - 所有環境都必須提供 `COPILOT_CLI_URL`，並讓 headless CLI process 透過 `COPILOT_GITHUB_TOKEN` 認證。
  - API runtime 必須支援 `@github/copilot-sdk`，並能連線至 Copilot CLI headless server。
