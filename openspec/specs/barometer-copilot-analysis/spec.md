## Purpose

定義晴雨表分析透過 GitHub Copilot SDK 連線 Copilot CLI headless server 的提供者行為、回應 schema 驗證、重試規則與工具權限限制。

## Requirements
### Requirement: Copilot SDK 晴雨表分析提供者
系統 SHALL 使用 GitHub Copilot SDK shared runtime 產生未快取的每日晴雨表分析，且 SHALL 一律透過 `COPILOT_CLI_URL` 連線至 Copilot CLI headless server。晴雨表分析 SHALL 保持 ephemeral 一次性 session 語意，且 MUST NOT 以日期持久化 Copilot runtime memory。

#### Scenario: 已設定 Headless CLI URL
- **WHEN** 請求未快取的晴雨表分析，且 API process 可讀取 `COPILOT_CLI_URL`
- **THEN** 系統 SHALL 透過 shared Copilot runtime 連線至該 headless CLI server 產生分析，而不是由 API process 自行啟動 CLI 或建立 request-scoped Copilot client

#### Scenario: 晴雨表分析使用 ephemeral session
- **WHEN** 系統執行未快取的晴雨表 Copilot analysis
- **THEN** 系統 SHALL 建立不帶持久化日期範圍 session id 的全新 Copilot session
- **AND** 系統 SHALL 在完成或失敗後 disconnect 該 session

#### Scenario: 未設定 Headless CLI URL
- **WHEN** 請求未快取的晴雨表分析，且 API process 無 `COPILOT_CLI_URL`
- **THEN** 系統 SHALL 回傳 HTTP 503，且 MUST NOT 寫入 `MarketStats.aiAnalysis`

#### Scenario: Copilot SDK 呼叫失敗
- **WHEN** GitHub Copilot SDK 呼叫失敗、headless CLI 無法連線、逾時，或無法完成認證
- **THEN** 系統 SHALL 回傳 HTTP 503，且 MUST NOT 寫入 `MarketStats.aiAnalysis`

### Requirement: Copilot 回應 schema 驗證
系統 SHALL 只接受可解析為 JSON 且通過 `BarometerOutputSchema` 驗證的 Copilot SDK 回應。

#### Scenario: Copilot 回傳有效 JSON
- **WHEN** Copilot SDK 回傳包含有效 `level` 與 `summary` 的 JSON
- **THEN** 系統 SHALL 使用 `BarometerOutputSchema` 驗證該 JSON，將 level 對應到既有 weather 與 label，快取結果並回傳

#### Scenario: Copilot 第一次回傳無效 JSON
- **WHEN** Copilot SDK 第一次回傳無法解析的 JSON，或回傳不符合 schema 的 JSON
- **THEN** 系統 SHALL 重試一次 Copilot request，並指示模型只回傳必要的 JSON object

#### Scenario: Copilot 第二次仍回傳無效 JSON
- **WHEN** Copilot SDK 在重試後仍回傳無法解析的 JSON，或回傳不符合 schema 的 JSON
- **THEN** 系統 SHALL 回傳 HTTP 503，且 MUST NOT 寫入 `MarketStats.aiAnalysis`

### Requirement: 晴雨表分析不使用 agent tools
系統 SHALL 將 Copilot SDK 視為晴雨表分析的文字生成提供者，且此 workflow SHALL NOT 需要 file、shell、git、web、MCP 或其他 agent tool 存取權限。

#### Scenario: 分析 prompt 包含所有必要上下文
- **WHEN** 系統呼叫 Copilot SDK 進行晴雨表分析
- **THEN** prompt SHALL 包含既有 system instructions 與計算後的 market-data user message，使模型不需外部工具即可回答
