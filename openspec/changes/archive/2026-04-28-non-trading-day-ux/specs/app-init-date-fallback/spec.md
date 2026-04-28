## MODIFIED Requirements

### Requirement: App initializes to most recent trading day
系統 SHALL 在 App 啟動時將選中日期設為今日，立即渲染頁面，不進行任何日期 fallback，也不等待任何非同步操作。

#### Scenario: App starts without ?date= parameter
- **WHEN** 使用者直接瀏覽任一頁面（無 `?date=` 參數）
- **THEN** App 將 `selectedDate` 設為今日，立即渲染頁面，不呼叫 `/trading-date`

#### Scenario: App starts with valid ?date= parameter
- **WHEN** 使用者開啟含有 `?date=2026-04-25` 的連結
- **THEN** App 以 `2026-04-25` 作為選中日期，立即渲染頁面，不做 fallback

#### Scenario: App starts with ?date= pointing to a non-trading day
- **WHEN** 使用者開啟含有 `?date=2026-04-26`（週六）的連結
- **THEN** App 以 `2026-04-26` 作為選中日期，頁面顯示該日期的空狀態，不自動 fallback

#### Scenario: App starts with malformed ?date= parameter
- **WHEN** `?date=` 包含非法日期格式（如 `?date=abc`）
- **THEN** App 以今日作為選中日期，立即渲染頁面

## REMOVED Requirements

### Requirement: Pages do not load until date is ready
**Reason**: 移除 dateReady gate——啟動時 selectedDate 為確定值（今日或 URL 中的合法日期），頁面無需等待任何非同步操作即可渲染。
**Migration**: 移除 `AppComponent` template 中的 `@if (dateReady())` 條件，及 `DashboardStateService` 中的 `dateReady` signal 與 `setDateReady()` 方法。
