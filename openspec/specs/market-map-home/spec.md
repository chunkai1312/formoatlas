# market-map-home Specification

## Purpose
TBD - created by archiving change add-home-page-and-market-overview-route. Update Purpose after archive.
## Requirements
### Requirement: 每日市場地圖首頁
系統 SHALL 在 `/` route 提供每日市場地圖首頁，使用全域 selected date 呈現市場快照。

#### Scenario: 進入首頁
- **WHEN** user navigates to `/`
- **THEN** web app SHALL render 每日市場地圖首頁，而不是大盤總覽頁

#### Scenario: 首頁使用選取日期
- **WHEN** user changes the global selected date
- **THEN** 首頁 SHALL 以該日期重新載入市場快照摘要

### Requirement: 市場快照摘要
首頁 SHALL 顯示今日市場摘要，彙整大盤氣候、資金移動與個股焦點的主要訊號。

#### Scenario: 顯示今日市場摘要
- **WHEN** 首頁載入選取日期
- **THEN** 系統 SHALL 顯示今日市場摘要區塊
- **AND** 摘要 SHALL 優先使用可用資料描述市場狀態

#### Scenario: 摘要資料不足
- **WHEN** 首頁無足夠資料產生市場摘要
- **THEN** 系統 SHALL 顯示中性的缺資料或等待資料狀態
- **AND** 系統 MUST NOT 顯示誤導性的市場結論

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

### Requirement: 首頁資料狀態
首頁 SHALL 讓各市場快照區塊獨立處理 loading、empty 與 error 狀態。

#### Scenario: 單一區塊資料載入失敗
- **WHEN** 大盤氣候、資金移動或個股焦點其中一個資料來源載入失敗
- **THEN** 首頁 SHALL 在該區塊顯示可理解的 fallback 狀態，且其他區塊仍可正常呈現

#### Scenario: 選取日期無市場資料
- **WHEN** selected date 沒有可用市場資料
- **THEN** 首頁 SHALL 顯示缺資料狀態與功能頁入口，且 MUST NOT 顯示誤導性的市場結論

### Requirement: 首頁研究助理脈絡
首頁 SHALL 將市場研究助理 context 設為 `home`。

#### Scenario: 從首頁開啟研究助理
- **WHEN** user 在首頁開啟研究助理並送出問題
- **THEN** web app SHALL 將 `home` 作為 route context 傳送給 market research agent

