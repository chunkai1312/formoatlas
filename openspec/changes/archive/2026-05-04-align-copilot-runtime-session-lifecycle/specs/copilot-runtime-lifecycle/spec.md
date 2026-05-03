## 新增 Requirements

### Requirement: 共用 Copilot Client 生命週期
API backend SHALL 以 process-level runtime concern 管理 GitHub Copilot SDK client 生命週期。Backend SHALL 透過共用 `CopilotClient` 連線至設定的 Copilot CLI headless server，而非為每個 Copilot-backed request 各自建立與停止 client。

#### Scenario: API process 初始化 Copilot runtime
- **WHEN** API process 需要執行 Copilot-backed workflow 且已設定 `COPILOT_CLI_URL`
- **THEN** 系統 SHALL 使用以該 CLI URL 設定的共用 Copilot SDK client

#### Scenario: 多個 workflow 使用 Copilot
- **WHEN** 晴雨表分析與市場研究 agent execution 在同一 API process 生命週期內都需要 Copilot
- **THEN** 兩個 workflow 都 SHALL 透過共用 Copilot runtime 取得 session，而非各自建立獨立的 request-scoped client

#### Scenario: API process 關閉
- **WHEN** API process 或 Copilot runtime module 被銷毀
- **THEN** 系統 SHALL 停止共用 Copilot SDK client，並記錄 cleanup 失敗，但在 shutdown 過程中 MUST NOT 向使用者拋出 request errors

#### Scenario: 未設定 CLI URL
- **WHEN** 有 Copilot-backed workflow 請求但未設定 `COPILOT_CLI_URL`
- **THEN** 系統 SHALL 以 service unavailable response 使該 workflow 失敗
- **AND** 系統 MUST NOT 嘗試建立 Copilot session

### Requirement: Workflow Session 生命週期
API backend SHALL 將 Copilot session 視為 workflow-scoped resource。Ephemeral workflow SHALL 使用全新的未命名 session；conversation workflow SHALL 使用 app-owned 的穩定 session identifier。

#### Scenario: Ephemeral 一次性 workflow
- **WHEN** 晴雨表分析或單輪市場研究 request 建立 Copilot session
- **THEN** 系統 SHALL 建立不帶 conversation-owned `sessionId` 的全新 Copilot session
- **AND** 系統 SHALL 在完成或失敗後 disconnect 該 session

#### Scenario: Conversation workflow
- **WHEN** conversation-scoped 市場研究 request 建立或恢復 Copilot session
- **THEN** 系統 SHALL 使用 conversation record 的 app-owned `copilotSessionId`
- **AND** 系統 SHALL 在完成或失敗後 disconnect 該 session，同時保留可恢復的 session state

#### Scenario: Runtime session state 非產品歷史記錄
- **WHEN** conversation 存在 Copilot session state
- **THEN** MongoDB conversation 與 message records SHALL 保持為標準產品對話紀錄
- **AND** Copilot session state SHALL 僅視為 runtime memory

### Requirement: 共用 CLI 操作邊界
Backend SHALL 將 Copilot CLI headless server 作為明確設定的外部 runtime dependency，並維護其操作邊界文件。

#### Scenario: SDK 至 CLI 的網路路徑
- **WHEN** API 連線至 `COPILOT_CLI_URL`
- **THEN** 部署環境 SHALL 將該網路路徑作為受信任的基礎架構加以保護
- **AND** 應用程式 MUST NOT 暴露對 Copilot CLI URL 或 session identifier 的直接客戶端控制

#### Scenario: 未來水平擴展
- **WHEN** API 以多個 API replica 或多個 Copilot CLI server 部署
- **THEN** 系統 SHALL 在依賴跨 replica conversation session resumption 前，需要 sticky routing 或共用 Copilot session storage 加分散式鎖定
