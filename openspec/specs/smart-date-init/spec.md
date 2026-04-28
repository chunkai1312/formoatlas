## Purpose

定義 App 啟動時根據 URL `?date=` 參數選擇不同初始化路徑的行為，確保無參數時先查最近有效交易日、有參數時誠實呈現。

## Requirements

### Requirement: Smart date initialization on app startup
系統 SHALL 在 App 啟動時，依據 URL 是否含有 `?date=` 參數選擇不同的初始化路徑：有 `?date=` 時立即載入；無 `?date=` 時先查最近有效交易日再觸發資料載入。

無 `?date=` 的等待期間，頁面 SHALL 顯示全頁 loading skeleton，不渲染任何資料卡片，直到 `/trading-date` 回應並設定 `selectedDate`。

#### Scenario: App starts without ?date= — gate activates
- **WHEN** 使用者直接瀏覽任一頁面（無 `?date=` 參數）
- **THEN** App 顯示 loading skeleton，不發出任何資料 API
- **AND** App 呼叫 `GET /trading-date?before=today`

#### Scenario: /trading-date returns latest date — data loads
- **WHEN** `/trading-date` 回傳 `{ date: "2026-04-25" }`
- **THEN** `selectedDate` 設為 `2026-04-25`，URL 更新為 `?date=2026-04-25`
- **AND** 所有資料 API 以 `2026-04-25` 為日期發出請求
- **AND** loading skeleton 消失，頁面正常渲染資料

#### Scenario: /trading-date returns null — fallback to today
- **WHEN** `/trading-date` 回傳 null（DB 無任何資料）
- **THEN** `selectedDate` 設為今日，`dateReady` 設為 true
- **AND** 頁面渲染今日的空狀態，不顯示錯誤

#### Scenario: App starts with valid ?date= — no gate
- **WHEN** 使用者開啟含有 `?date=2026-04-25` 的連結
- **THEN** App 立即設定 `selectedDate = 2026-04-25`，`dateReady = true`
- **AND** 不呼叫 `/trading-date`，立即發出所有資料 API

#### Scenario: App starts with ?date= pointing to non-trading day — no gate, honest empty
- **WHEN** 使用者開啟含有 `?date=2026-04-26`（週六）的連結
- **THEN** App 立即設定 `selectedDate = 2026-04-26`，`dateReady = true`
- **AND** 各卡片顯示空狀態，不做任何 fallback

#### Scenario: App starts with malformed ?date= — fallback to gate
- **WHEN** `?date=` 包含非法日期格式（如 `?date=abc`）
- **THEN** App 視同無 `?date=`，觸發 gate，查詢 `/trading-date`
