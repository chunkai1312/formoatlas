## ADDED Requirements

### Requirement: App initializes to most recent trading day
系統 SHALL 在 App 啟動時自動將選中日期設為最近的交易日，並確保所有頁面在日期確定後才開始載入資料。

#### Scenario: App starts without ?date= parameter
- **WHEN** 使用者直接瀏覽任一頁面（無 `?date=` 參數）
- **THEN** App 查詢 `today` 或之前最近交易日，設為選中日期，並將 `?date=` 寫入 URL

#### Scenario: App starts with valid ?date= parameter
- **WHEN** 使用者開啟含有 `?date=2026-04-25` 的連結，且該日期有交易資料
- **THEN** App 以 `2026-04-25` 作為選中日期，不做任何 fallback

#### Scenario: App starts with ?date= pointing to a non-trading day
- **WHEN** 使用者開啟含有 `?date=2026-04-26`（週六）的連結
- **THEN** App fallback 到 `2026-04-26` 之前最近的交易日，並更新 URL

#### Scenario: App starts with malformed ?date= parameter
- **WHEN** `?date=` 包含非法日期格式（如 `?date=abc`）
- **THEN** App 以今日作為查詢起點，fallback 到最近交易日

#### Scenario: Pages do not load until date is ready
- **WHEN** App 啟動，`/trading-date` API 尚未回應
- **THEN** 頁面內容不渲染（顯示載入中狀態），直到日期確定
