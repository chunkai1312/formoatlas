## MODIFIED Requirements

### Requirement: Web 研究助理 Panel

web app SHALL 在既有市場頁面與首頁提供 research assistant panel 或 drawer。Session view SHALL use a bottom composer pattern for market research questions and SHALL expose a single research mode affordance as the first version of future assistant extensibility without changing agent execution semantics.

#### Scenario: 從首頁開啟助理

- **WHEN** user 從 `/` 首頁開啟助理
- **THEN** panel SHALL 在不離開首頁的情況下開啟，且 SHALL 使用 `home` route context

#### Scenario: 從市場頁面開啟助理

- **WHEN** user 從 `/market-overview`、`/sector-flow` 或 `/hot-stocks` pages 開啟助理
- **THEN** panel SHALL 在不離開目前頁面的情況下開啟，且 SHALL 使用對應的 route context

#### Scenario: Session composer 置底

- **WHEN** user 進入 research assistant session view
- **THEN** panel SHALL keep the question composer at the bottom of the session view
- **AND** the message thread SHALL use the remaining vertical space as the primary scroll area
- **AND** the composer textarea SHALL use the full available composer width rather than being compressed by mode or submit controls

#### Scenario: 從助理 Panel 送出問題

- **WHEN** user 從 assistant panel 的 session composer 送出問題
- **THEN** web app SHALL 將問題、選取日期與支援的頁面脈絡送到 agent API，並顯示 streaming progress events

#### Scenario: 顯示單一研究模式入口

- **WHEN** user views the session composer
- **THEN** web app SHALL present a single research-mode affordance
- **AND** the affordance SHALL NOT imply that additional assistant modes are currently available
- **AND** the submitted agent request SHALL keep the existing market research query contract

#### Scenario: 呈現結構化答案

- **WHEN** agent API 透過 final event 回傳有效結構化答案
- **THEN** panel SHALL 呈現 summary、key findings、evidence references 與 follow-up questions

#### Scenario: Agent Request 失敗

- **WHEN** agent API 回傳 validation、unavailable、timeout errors 或 streaming error event
- **THEN** panel SHALL 顯示可恢復的 error state，且不干擾目前頁面
