## ADDED Requirements

### Requirement: Watch List 管理頁面
web app SHALL 提供受登入保護的自選股管理頁面，讓使用者以既有 watch list API 檢視、新增與移除追蹤股票。

#### Scenario: 已登入使用者載入 Watch List 頁面
- **WHEN** 已登入使用者進入 `/watchlist`
- **THEN** web app SHALL 載入該使用者的 watch list
- **AND** SHALL 顯示 watch list count 與 tracked symbol rows

#### Scenario: Watch List 載入中
- **WHEN** web app 正在載入 watch list
- **THEN** watch list page SHALL 顯示 loading state
- **AND** SHALL NOT 顯示誤導性的空清單狀態

#### Scenario: Watch List 載入失敗
- **WHEN** watch list API request 失敗
- **THEN** watch list page SHALL 顯示可恢復的 error state
- **AND** SHALL 提供重新載入 watch list 的操作

#### Scenario: Watch List 為空
- **WHEN** 已登入使用者的 watch list 沒有任何 symbol
- **THEN** watch list page SHALL 顯示 empty state
- **AND** SHALL 提供新增 symbol 的輸入入口
- **AND** SHALL 提供前往熱門個股頁面的導引

### Requirement: Watch List 股票名稱呈現
系統 SHALL 使用 read-only ticker metadata 在自選股列顯示股票名稱，同時保持 user watch list 只儲存股票代號。

#### Scenario: Watch List metadata 載入成功
- **WHEN** 已登入使用者的 watch list 包含 symbol，且 ticker metadata lookup 找到對應股票名稱
- **THEN** watch list row SHALL 顯示股票名稱作為主要文字
- **AND** SHALL 顯示股票代號作為次要文字
- **AND** SHALL NOT 要求變更 user watch list database schema

#### Scenario: Watch List metadata 載入失敗或缺漏
- **WHEN** ticker metadata lookup 失敗或某個 symbol 缺少 metadata
- **THEN** watch list page SHALL 繼續顯示該 symbol
- **AND** SHALL NOT 阻擋 add 或 remove watch list operations

#### Scenario: Watch List metadata API
- **WHEN** web app 為一個或多個 watch list symbols 請求 ticker metadata
- **THEN** API SHALL 回傳可用的 read-only metadata，包含 symbol、股票名稱與 market
- **AND** SHALL 優先使用 equity reference metadata
- **AND** MAY 在 equity reference metadata 缺漏時 fallback 到最新 ticker market data
- **AND** SHALL NOT 將股票名稱複製進 user watch list record

#### Scenario: Watch List metadata cache
- **WHEN** web app 在目前 session 已解析過某個 symbol 的 ticker metadata
- **THEN** web app SHALL 在後續 watch list metadata request 中重用 cached metadata
- **AND** SHALL 只為目前 session 尚未查詢過的 symbols 請求 metadata

### Requirement: Watch List 新增與移除 UI
web app SHALL 讓已登入使用者在不離開 watch list management page 的情況下新增與移除 symbols。

#### Scenario: 新增股票代號
- **WHEN** 已登入使用者在 watch list page 輸入非空白股票代號並提交
- **THEN** web app SHALL 呼叫 watch list add API
- **AND** SHALL 以 API 回傳的 watch list 更新畫面

#### Scenario: 新增時正規化股票代號
- **WHEN** 使用者提交包含前後空白或小寫字母的 symbol
- **THEN** web app SHALL 在呼叫 add API 前 trim 該值並套用一致的 normalize 規則

#### Scenario: 移除股票代號
- **WHEN** 已登入使用者在 watch list row 選擇移除 symbol
- **THEN** web app SHALL 呼叫 watch list remove API
- **AND** SHALL 以 API 回傳的 watch list 更新畫面

#### Scenario: 新增或移除失敗
- **WHEN** add or remove API request 失敗
- **THEN** web app SHALL 保留或恢復最近一次確認成功的 watch list
- **AND** SHALL 顯示可理解的錯誤狀態

### Requirement: Watch List 未登入提示
web app SHALL 在未登入使用者嘗試使用 watch list features 時，顯示一致的登入提示。

#### Scenario: 未登入使用者進入 Watch List 頁面
- **WHEN** 未登入使用者嘗試開啟 `/watchlist` 或從導覽列選擇「自選股」
- **THEN** web app SHALL 顯示登入提示
- **AND** SHALL NOT 在使用者完成登入前呼叫 watch list API

#### Scenario: 未登入使用者從股票列加入自選
- **WHEN** 未登入使用者在 market page symbol row 選擇加入自選
- **THEN** web app SHALL 顯示登入提示
- **AND** SHALL NOT 呼叫 watch list add API

#### Scenario: 登入提示提供 Google 登入
- **WHEN** watch list features 顯示登入提示
- **THEN** 登入提示 SHALL 提供使用既有 auth login flow 的 Google 登入操作

### Requirement: Market Page Watch List Quick Toggle
web app SHALL 在支援的 market page symbol rows 提供 compact watch list toggle controls，第一版從 hot stocks ranking rows 開始。

#### Scenario: 顯示未加入自選的股票列
- **WHEN** 已登入使用者查看支援的 market page symbol row，且該 symbol 不在 watch list 中
- **THEN** 該列 SHALL 顯示 add-to-watch-list icon control
- **AND** 該 control SHALL expose 識別 symbol 與 add action 的 accessible label

#### Scenario: 顯示已加入自選的股票列
- **WHEN** 已登入使用者查看支援的 market page symbol row，且該 symbol 已在 watch list 中
- **THEN** 該列 SHALL 顯示 selected watch-list icon control
- **AND** 該 control SHALL expose 識別 symbol 與 remove action 的 accessible label

#### Scenario: 從股票列加入自選
- **WHEN** 已登入使用者啟用支援 symbol row 上的 add-to-watch-list control
- **THEN** web app SHALL 為該 symbol 呼叫 watch list add API
- **AND** SHALL 以回傳的 watch list 更新所有可見 watch list toggle states

#### Scenario: 從股票列移除自選
- **WHEN** 已登入使用者啟用支援 symbol row 上的 remove-from-watch-list control
- **THEN** web app SHALL 為該 symbol 呼叫 watch list remove API
- **AND** SHALL 以回傳的 watch list 更新所有可見 watch list toggle states

#### Scenario: Quick toggle request in flight
- **WHEN** 某個 symbol 的 add 或 remove request 正在執行
- **THEN** web app SHALL 在該 request 完成前防止同一 symbol 的重複 request
