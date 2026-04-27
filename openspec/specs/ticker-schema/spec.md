## Purpose
定義 `Ticker` 文件中三大法人籌碼 sub-document 的資料結構、optional 欄位語意與依法人淨買賣超排名查詢的 dotted path 使用方式，避免指數與個股資料結構混淆。

## Requirements

### Requirement: Ticker schema 定義 instInvestors sub-document
`Ticker` document 中的三大法人籌碼資料 SHALL 以 `instInvestors` sub-document 組織，結構為三個機構（`fini`、`sitc`、`dealers`）各自含 `buy`（買超量）、`sell`（賣超量）、`net`（淨買賣超）三個欄位。`instInvestors` 欄位 SHALL 為 optional，以反映指數類 Ticker 不含籌碼資料的事實。

#### Scenario: Equity Ticker 寫入三大法人詳細資料
- **WHEN** 系統執行個股三大法人買賣超更新
- **THEN** 資料以 `{ instInvestors: { fini: { buy, sell, net }, sitc: { buy, sell, net }, dealers: { buy, sell, net } } }` 格式寫入對應的 Ticker document

#### Scenario: Index Ticker 不含籌碼資料
- **WHEN** 查詢指數類 Ticker document
- **THEN** 該 document 不含 `instInvestors` 欄位，且不含舊的頂層籌碼欄位

#### Scenario: 依三大法人淨買賣超排名查詢
- **WHEN** 呼叫 `getInstInvestorsTrades` 並指定機構別（fini/sitc/dealers）與方向（buy/sell）
- **THEN** 系統使用 `instInvestors.${inst}.net` dotted path 進行篩選與排序，並回傳正確結果
