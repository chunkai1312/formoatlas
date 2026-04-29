## ADDED Requirements

### Requirement: Assistant FAB 未登入提示
web app SHALL 在未登入使用者點選市場研究助理 FAB 時，顯示共用登入提示。

#### Scenario: 未登入使用者點選 Agent FAB
- **WHEN** 未登入使用者點選右下方市場研究助理 FAB
- **THEN** web app SHALL 顯示共用登入提示
- **AND** SHALL NOT 開啟助理 panel
- **AND** SHALL NOT 在登入前載入 agent conversations

#### Scenario: 已登入使用者點選 Agent FAB
- **WHEN** 已登入使用者點選右下方市場研究助理 FAB
- **THEN** web app SHALL 開啟助理 panel
- **AND** SHALL 在 conversations 尚未載入時載入 agent conversations
