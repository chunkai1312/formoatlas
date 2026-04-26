## 1. 依賴與設定

- [x] 1.1 在專案 dependencies 與 lockfile 中，以 `@github/copilot-sdk` 取代 LangChain packages。
- [x] 1.2 將 API 環境變數文件由 `OPENAI_API_KEY` 更新為必填的 `COPILOT_CLI_URL`。

## 2. Copilot SDK 整合

- [x] 2.1 將 `BarometerService` 中的 LangChain structured-output 呼叫替換為 Copilot SDK single-turn analysis 呼叫。
- [x] 2.2 一律透過 `COPILOT_CLI_URL` 連線 Copilot CLI headless server，移除 API process 的 `COPILOT_GITHUB_TOKEN` fallback。
- [x] 2.3 為 Copilot 回應新增 JSON 抽取/解析與 `BarometerOutputSchema` 驗證。
- [x] 2.4 對無效的 Copilot JSON/schema output 新增一次 retry path，並在最終失敗時保留 HTTP 503 行為。
- [x] 2.5 確保成功的 Copilot output 保留既有 level-to-weather/label 對應與 DB cache 寫入行為。

## 3. 驗證

- [x] 3.1 執行 dependency installation/update，並確認 lockfile 一致。
- [x] 3.2 執行 API build 或相關 TypeScript 驗證。
- [x] 3.3 執行此 change 的 OpenSpec validation。
