## ADDED Requirements

### Requirement: Date reflected in URL query parameter
系統 SHALL 在任何頁面下，將目前選中的日期以 `?date=YYYY-MM-DD` 的形式反映在瀏覽器網址列。

#### Scenario: User changes date via toolbar
- **WHEN** 使用者點擊 toolbar 的前/後一日按鈕或日期選擇器
- **THEN** URL 的 `?date=` 參數即時更新為新日期

#### Scenario: URL is shareable
- **WHEN** 使用者複製含有 `?date=2026-04-25` 的網址並分享
- **THEN** 接收連結者開啟後，頁面自動顯示 2026-04-25 的行情資料

#### Scenario: Navigating between routes preserves date
- **WHEN** 使用者在 `大盤總覽`、`資金流向`、`熱門個股` 之間切換
- **THEN** URL 的 `?date=` 參數保持不變
