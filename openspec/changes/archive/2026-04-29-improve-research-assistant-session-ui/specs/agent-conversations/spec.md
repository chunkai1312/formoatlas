## MODIFIED Requirements

### Requirement: Web 研究助理 Thread UI

web app SHALL 將研究助理呈現為可載入、切換與恢復的 conversation thread，並以 conversation list view 與 session view 兩層資訊架構呈現保存的對話，而不是只顯示單一 ephemeral answer 或在同一畫面混合完整列表與完整 thread。

#### Scenario: 開啟助理先顯示對話列表

- **WHEN** 已登入使用者開啟 research assistant panel
- **THEN** web app SHALL 載入 conversation summaries 並顯示 conversation list view
- **AND** web app SHALL NOT 自動切入最近 conversation 的 session view

#### Scenario: 顯示對話摘要列表

- **WHEN** web app 顯示 conversation list view
- **THEN** it SHALL 顯示每個 conversation 的 title、message count、last message time 與可用的 context/date hint

#### Scenario: 選擇對話進入 session

- **WHEN** 使用者從 conversation list view 選擇另一個 conversation
- **THEN** web app SHALL 載入該 conversation detail
- **AND** web app SHALL 切換到 session view 呈現該 conversation 的 messages

#### Scenario: 從 session 返回列表

- **WHEN** 使用者在 session view 選擇返回列表
- **THEN** web app SHALL 顯示 conversation list view
- **AND** current conversation detail MAY remain cached but SHALL NOT dominate the visible panel state

#### Scenario: 顯示訊息歷史

- **WHEN** web app 載入 conversation detail 並進入 session view
- **THEN** research assistant panel SHALL 顯示 user messages、completed assistant answers 與 failed assistant states

#### Scenario: 建立新對話

- **WHEN** 使用者在研究助理 panel 選擇新對話
- **THEN** web app SHALL 建立新的 conversation
- **AND** web app SHALL 載入該 conversation detail 並切換到 session view
- **AND** 後續問題 SHALL 送入該 thread

#### Scenario: 刪除目前對話後更新 UI

- **WHEN** 使用者刪除目前 conversation
- **THEN** web app SHALL 從列表移除該 conversation
- **AND** web app SHALL 回到 conversation list view or 顯示無對話的 list empty state

#### Scenario: 送出問題後留在 session

- **WHEN** 使用者在 session view 送出問題
- **THEN** web app SHALL 將問題送入目前 conversation
- **AND** web app SHALL 留在該 conversation 的 session view while streaming and after final or error completion
