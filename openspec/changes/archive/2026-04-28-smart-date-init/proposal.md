## Why

目前網頁載入時無論是否為交易日，都同時發出所有 API 請求（6-7 支），導致非交易日或今日資料尚未更新時打出一批無謂的 304 請求，前端再過濾後顯示空狀態，造成不必要的網路與 DB 開銷。此外，直接存取無日期參數的 URL 時，使用者無法直接看到最新有效資料。

## What Changes

- **移除** `AppComponent` 的 banner（非交易日橫幅）及相關邏輯
- **新增** 無 `?date=` 時的啟動 gate：先查 `/trading-date` 取得最近有資料日期，再帶著正確日期發出所有資料 API
- **保留** 有 `?date=` 時的直接載入行為：誠實呈現，若該日期無資料則顯示空狀態
- 手動切換日期（Toolbar DatePicker / 前後日）行為不變，仍更新 URL `?date=` 並誠實呈現

## Capabilities

### New Capabilities

- `smart-date-init`: 無 URL 日期參數時，先查最近有效交易日再觸發全部資料載入；有 URL 日期參數時直接載入，非交易日誠實顯示空狀態

### Modified Capabilities

- `app-init-date-fallback`: 啟動行為改為 gate-driven——無 `?date=` 時顯示全頁 loading skeleton，等 `/trading-date` 回應後才發出所有資料 API

## Impact

- `apps/web/src/app/app.ts` / `app.html` / `app.scss`：移除 banner，加入 gate 機制
- `apps/web/src/app/core/services/dashboard-state.service.ts`：可能重新加入 `dateReady` 或等效的 loading gate signal
- 所有頁面元件（`HomeComponent`、`DashboardComponent`）：在 gate 通過後才觸發資料載入
- `/trading-date` API：不做修改，語義已符合需求（回傳最近有資料的日期）
