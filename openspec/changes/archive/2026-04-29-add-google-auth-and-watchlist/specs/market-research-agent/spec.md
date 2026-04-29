## MODIFIED Requirements

### Requirement: 互動式市場研究 Query API
系統 SHALL 提供單輪市場研究問題 API，使用選取交易日與選填頁面脈絡回答問題。支援的頁面 route context SHALL 包含 `home`、`market-overview`、`sector-flow` 與 `hot-stocks`。**API 端點 SHALL 受 JWT Auth Guard 保護，未登入的 request 將收到 401。**

#### Scenario: 送出有效市場研究問題
- **WHEN** 已登入 client 送出非空白問題與選取的 `date`
- **THEN** 系統 SHALL 呼叫市場研究 agent，並回傳該問題的結構化答案

#### Scenario: 送出頁面脈絡
- **WHEN** 已登入 client 在問題中包含 `home`、`market-overview`、`sector-flow`、`hot-stocks` 或其他支援的頁面脈絡
- **THEN** 系統 SHALL 將該脈絡提供給 agent 作為預設分析脈絡

#### Scenario: 缺少選取日期
- **WHEN** 已登入 client 送出問題但未提供選取的 `date`
- **THEN** 系統 SHALL 以 validation error 拒絕該 request

#### Scenario: 問題無效或過長
- **WHEN** 已登入 client 送出空白問題或超過支援長度的問題
- **THEN** 系統 SHALL 以 validation error 拒絕該 request，且 MUST NOT 呼叫 Copilot

#### Scenario: 未登入 client 送出問題
- **WHEN** 未登入 client 呼叫 `/api/agent/market-research` 或 `/api/agent/market-research/stream`
- **THEN** 系統 SHALL 回傳 401，MUST NOT 呼叫 Copilot
