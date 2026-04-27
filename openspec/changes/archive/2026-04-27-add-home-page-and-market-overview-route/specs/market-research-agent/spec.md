## MODIFIED Requirements

### Requirement: 互動式市場研究 Query API
系統 SHALL 提供單輪市場研究問題 API，使用選取交易日與選填頁面脈絡回答問題。支援的頁面 route context SHALL 包含 `home`、`market-overview`、`sector-flow` 與 `hot-stocks`。

#### Scenario: 送出有效市場研究問題
- **WHEN** client 送出非空白問題與選取的 `date`
- **THEN** 系統 SHALL 呼叫市場研究 agent，並回傳該問題的結構化答案

#### Scenario: 送出頁面脈絡
- **WHEN** client 在問題中包含 `home`、`market-overview`、`sector-flow`、`hot-stocks` 或其他支援的頁面脈絡
- **THEN** 系統 SHALL 將該脈絡提供給 agent 作為預設分析脈絡

#### Scenario: 缺少選取日期
- **WHEN** client 送出問題但未提供選取的 `date`
- **THEN** 系統 SHALL 以 validation error 拒絕該 request

#### Scenario: 問題無效或過長
- **WHEN** client 送出空白問題或超過支援長度的問題
- **THEN** 系統 SHALL 以 validation error 拒絕該 request，且 MUST NOT 呼叫 Copilot

### Requirement: Web 研究助理 Panel
web app SHALL 在既有市場頁面與首頁提供 research assistant panel 或 drawer。

#### Scenario: 從首頁開啟助理
- **WHEN** user 從 `/` 首頁開啟助理
- **THEN** panel SHALL 在不離開首頁的情況下開啟，且 SHALL 使用 `home` route context

#### Scenario: 從市場頁面開啟助理
- **WHEN** user 從 `/market-overview`、`/sector-flow` 或 `/hot-stocks` pages 開啟助理
- **THEN** panel SHALL 在不離開目前頁面的情況下開啟，且 SHALL 使用對應的 route context

#### Scenario: 從助理 Panel 送出問題
- **WHEN** user 從 assistant panel 送出問題
- **THEN** web app SHALL 將問題、選取日期與支援的頁面脈絡送到 agent API，並顯示 streaming progress events

#### Scenario: 呈現結構化答案
- **WHEN** agent API 透過 final event 回傳有效結構化答案
- **THEN** panel SHALL 呈現 summary、key findings、evidence references 與 follow-up questions

#### Scenario: Agent Request 失敗
- **WHEN** agent API 回傳 validation、unavailable、timeout errors 或 streaming error event
- **THEN** panel SHALL 顯示可恢復的 error state，且不干擾目前頁面
