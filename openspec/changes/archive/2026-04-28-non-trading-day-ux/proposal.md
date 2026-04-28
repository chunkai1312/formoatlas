## Why

目前 App 啟動時自動 fallback 到最近交易日，使用者看到的「永遠是有資料的日期」，造成錯覺——用戶不知道今天是否為交易日、資料是否最新。以透明取代靜默，讓系統誠實呈現選中日期的真實狀態，才能建立用戶對資料的正確信任。

## What Changes

- **移除** App 啟動時呼叫 `/trading-date` 強制 fallback 的邏輯；`selectedDate` 改為直接使用今日日期
- **移除** `dateReady` gate（`@if (dateReady())`），頁面立即渲染
- **移除** `DashboardStateService` 的 `dateReady` signal 與 `setDateReady()` 方法
- **移除** `ToolbarComponent` 中 `prevDay()` / `nextDay()` 的週末跳過邏輯；±1 天就是字面的 ±1 天
- **新增** 全局 non-trading-day banner：App 啟動後背景查詢 `/trading-date`，若今日無資料則顯示提示橫幅，並提供「查看最近交易日」捷徑按鈕
- **優化** 各頁面空狀態文案，明確標示「此日期無交易資料」

## Capabilities

### New Capabilities

- `non-trading-day-banner`: 全局橫幅，在今日無資料時提示使用者，並提供跳至最近交易日的導航捷徑

### Modified Capabilities

- `app-init-date-fallback`: 移除啟動時的 fallback 行為——App 以今日作為初始日期，不查詢 `/trading-date`，也不等待 `dateReady`

## Impact

- **Frontend Component**：`AppComponent` 移除 `ngOnInit` 的 `/trading-date` 呼叫與 `dateReady` gate；新增 banner signal 邏輯
- **Frontend Service**：`DashboardStateService` 移除 `dateReady` / `setDateReady()`
- **Frontend Component**：`ToolbarComponent` 移除 `prevDay()` / `nextDay()` 的週末跳過條件
- **Frontend Component**：新增 `NonTradingDayBannerComponent`（或整合至 `AppComponent` template）
- **API**：無變動
