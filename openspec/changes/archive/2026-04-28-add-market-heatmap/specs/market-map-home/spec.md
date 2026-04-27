## MODIFIED Requirements

### Requirement: 市場快照維度
首頁 SHALL 並列呈現「大盤氣候」、「資金移動」、「個股焦點」三個市場快照維度，且 MUST NOT 將其呈現為強制操作流程。

#### Scenario: 不顯示順序標號
- **WHEN** 首頁顯示市場快照維度
- **THEN** 系統 MUST NOT 使用 `01`、`02`、`03` 或等價序號標示三個維度

#### Scenario: 顯示中性維度描述
- **WHEN** 首頁顯示市場快照維度
- **THEN** 各維度說明 SHALL 描述資料內容
- **AND** 說明 MUST NOT 暗示 user 應先看、觀察或依序操作

#### Scenario: 顯示大盤氣候區塊
- **WHEN** 首頁載入選取日期
- **THEN** 系統 SHALL 顯示大盤氣候區塊，包含晴雨等級、加權指數、成交金額或缺資料狀態，以及低調前往 `/market-overview` 的入口
- **AND** 晴雨等級 SHALL 顯示在加權指數上方
- **AND** 首頁 MUST NOT 在大盤氣候區塊顯示長篇市場摘要

#### Scenario: 顯示資金移動區塊
- **WHEN** 首頁載入選取日期
- **THEN** 系統 SHALL 顯示資金移動區塊，包含產業成交比重、成交比重變化或缺資料狀態，以及低調前往 `/sector-flow` 的入口
- **AND** 首頁快照 SHALL 顯示最多 5 筆產業資料
- **AND** 成交比重與變化 SHALL 使用 `%` 作為單位

#### Scenario: 顯示個股焦點區塊
- **WHEN** 首頁載入選取日期
- **THEN** 系統 SHALL 顯示個股焦點區塊，包含成交值排行、漲跌幅或缺資料狀態，以及低調前往 `/hot-stocks` 的入口
- **AND** 首頁快照 SHALL 顯示最多 5 筆個股資料

#### Scenario: 顯示市場熱力圖區塊
- **WHEN** 首頁載入選取日期
- **THEN** 系統 SHALL 在三張快照卡片下方顯示市場熱力圖區塊
- **AND** 熱力圖 SHALL 依 `market-heatmap` spec 的規格呈現
