## MODIFIED Requirements

### Requirement: Copilot SDK 晴雨表分析提供者
系統 SHALL 使用 GitHub Copilot SDK shared runtime 產生未快取的每日晴雨表分析，且 SHALL 一律透過 `COPILOT_CLI_URL` 連線至 Copilot CLI headless server。晴雨表分析 SHALL retain ephemeral one-shot session semantics and MUST NOT persist Copilot runtime memory by date.

#### Scenario: 已設定 Headless CLI URL
- **WHEN** 請求未快取的晴雨表分析，且 API process 可讀取 `COPILOT_CLI_URL`
- **THEN** 系統 SHALL 透過 shared Copilot runtime 連線至該 headless CLI server 產生分析，而不是由 API process 自行啟動 CLI 或建立 request-scoped Copilot client

#### Scenario: 晴雨表分析使用 ephemeral session
- **WHEN** 系統執行未快取的晴雨表 Copilot analysis
- **THEN** 系統 SHALL create a fresh Copilot session without a persistent date-scoped session id
- **AND** 系統 SHALL disconnect that session after completion or failure

#### Scenario: 未設定 Headless CLI URL
- **WHEN** 請求未快取的晴雨表分析，且 API process 無 `COPILOT_CLI_URL`
- **THEN** 系統 SHALL 回傳 HTTP 503，且 MUST NOT 寫入 `MarketStats.aiAnalysis`

#### Scenario: Copilot SDK 呼叫失敗
- **WHEN** GitHub Copilot SDK 呼叫失敗、headless CLI 無法連線、逾時，或無法完成認證
- **THEN** 系統 SHALL 回傳 HTTP 503，且 MUST NOT 寫入 `MarketStats.aiAnalysis`
