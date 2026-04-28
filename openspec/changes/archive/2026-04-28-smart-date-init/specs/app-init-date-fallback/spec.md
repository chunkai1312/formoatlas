## MODIFIED Requirements

### Requirement: App initializes to selected date immediately
系統 SHALL 在 App 啟動時，依 URL 是否含有 `?date=` 參數選擇初始化路徑：

- **有 `?date=`（合法日期）**：立即設定 `selectedDate`，`dateReady = true`，頁面立即渲染
- **有 `?date=`（非法格式）**：視同無 `?date=`，觸發 gate
- **無 `?date=`**：顯示 loading skeleton，查詢 `/trading-date` 取得最近有效日期，設定後觸發資料載入

#### Scenario: App starts without ?date= parameter
- **WHEN** 使用者直接瀏覽任一頁面（無 `?date=` 參數）
- **THEN** App 顯示 loading skeleton，呼叫 `/trading-date?before=today`
- **AND** 收到回應後設定 `selectedDate = latestDate`，URL 更新為 `?date=latestDate`
- **AND** 發出所有資料 API，skeleton 消失

#### Scenario: App starts with valid ?date= parameter
- **WHEN** 使用者開啟含有 `?date=2026-04-25` 的連結
- **THEN** App 以 `2026-04-25` 作為選中日期，立即渲染頁面，不呼叫 `/trading-date`

#### Scenario: App starts with ?date= pointing to a non-trading day
- **WHEN** 使用者開啟含有 `?date=2026-04-26`（週六）的連結
- **THEN** App 以 `2026-04-26` 作為選中日期，頁面各卡片顯示空狀態，不自動 fallback

#### Scenario: App starts with malformed ?date= parameter
- **WHEN** `?date=` 包含非法日期格式（如 `?date=abc`）
- **THEN** App 視同無 `?date=`，觸發 gate，查詢 `/trading-date`
