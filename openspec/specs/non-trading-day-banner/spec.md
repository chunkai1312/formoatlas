## Purpose

定義非交易日橫幅（Non-Trading Day Banner）功能需求，包含橫幅顯示時機、內容、操作行為及不阻塞頁面渲染的設計原則。

## Requirements

### Requirement: Non-trading day banner
系統 SHALL 在 App 啟動後，若今日（或選中日期）無交易資料，顯示全局橫幅提示使用者，並提供跳至最近交易日的導航捷徑。

橫幅 SHALL 顯示於 Toolbar 正下方，不阻塞頁面渲染——App 啟動時頁面立即呈現，橫幅僅在背景查詢完成後條件顯示。

#### Scenario: Today has no trading data — banner appears
- **WHEN** App 啟動，背景查詢 `/trading-date?before=today` 回傳的日期早於今日
- **THEN** 在 Toolbar 正下方顯示橫幅，內容為「今日行情尚未更新」，並顯示「查看最近交易日」按鈕

#### Scenario: Today has trading data — no banner
- **WHEN** App 啟動，背景查詢 `/trading-date?before=today` 回傳今日日期
- **THEN** 不顯示任何橫幅

#### Scenario: User navigates to latest trading day via banner
- **WHEN** 使用者點擊橫幅上的「查看最近交易日」按鈕
- **THEN** `selectedDate` 更新為最近交易日，URL `?date=` 同步更新，橫幅消失

#### Scenario: Banner does not block page rendering
- **WHEN** App 啟動，背景查詢尚未回應
- **THEN** 頁面正常渲染（`selectedDate = today`），橫幅區域不佔位，查詢完成後再顯示
