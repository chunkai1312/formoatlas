## Why

目前所有頁面切換日期後，網址不會改變，導致無法透過分享連結讓他人直接查看特定日期行情。同時，首頁、資金流向、熱門個股等頁面在選擇假日或無資料日期時，不會自動退回到最近有效交易日，造成頁面空白。

## What Changes

- 新增 API endpoint `GET /api/marketdata/trading-date?before=<date>`，回傳指定日期當天或之前最近的交易日
- `DashboardStateService` 的 `setDate()` 改為同步更新瀏覽器 URL 的 `?date=` query parameter
- App 啟動時讀取 `?date=` URL 參數作為初始日期（無參數則使用今日），並透過新 endpoint 自動 fallback 到最近交易日
- 移除 `DashboardComponent` 原有的「首次載入 setDate」副作用邏輯，改由 App 啟動統一處理

## Capabilities

### New Capabilities

- `trading-date-api`: 後端新增輕量 endpoint，查詢指定日期前最近的交易日
- `date-url-sync`: 前端日期狀態與 URL `?date=` 雙向同步，所有頁面共用同一個 query parameter
- `app-init-date-fallback`: App 啟動時的統一初始化流程——讀取 URL 參數、fallback 到最近交易日、寫回 URL

### Modified Capabilities

（無 spec 層級的需求異動）

## Impact

- **API**：`marketdata.controller.ts` 新增 `GET /trading-date` endpoint；`market-stats.repository.ts` 新增 `getLatestTradingDate()` 查詢
- **Frontend Service**：`DashboardStateService` 注入 `Router`，`setDate()` 增加 URL 同步
- **Frontend Component**：`AppComponent` 新增啟動初始化邏輯；`DashboardComponent` 移除 `dateInitialized` fallback 副作用
- **Routes**：無結構性變動，現有 `appRoutes` 維持不變
