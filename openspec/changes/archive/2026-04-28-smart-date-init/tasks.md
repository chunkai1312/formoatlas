## 1. 修改 DashboardStateService

- [x] 1.1 加回 `readonly dateReady = signal<boolean>(false)` 與 `setDateReady()` 方法
- [x] 1.2 確認 `selectedDate` 初始值維持 `DateTime.local().toISODate()`（不需改動）

## 2. 修改 AppComponent 啟動邏輯

- [x] 2.1 移除 `bannerLatestDate` signal 及 `navigateToLatestTradingDay()` 方法
- [x] 2.2 修改 `ngOnInit()`：若 URL 有合法 `?date=` 則立即 `setDateReady(true)`；否則觸發 gate
- [x] 2.3 gate 邏輯：呼叫 `tradingDateService.getLatestTradingDate(today)`，收到回應後 `setDate(latestDate ?? today)` 再 `setDateReady(true)`
- [x] 2.4 `/trading-date` 回 null 時 fallback：`setDate(today)`，`setDateReady(true)`

## 3. 修改 AppComponent Template 與樣式

- [x] 3.1 修改 `app.html`：移除 banner 相關 template，加回 `@if (dateReady())` 包裹 `<router-outlet>`
- [x] 3.2 加入 loading skeleton（或簡單的 loading 佔位）於 `@if (!dateReady())` 區塊
- [x] 3.3 修改 `app.scss`：移除 banner 相關樣式（`.non-trading-day-banner`、`.banner-message`、`.banner-action`）

## 4. 更新測試

- [x] 4.1 更新 `app.spec.ts`：移除 banner 相關測試，加入 gate 行為測試（無 `?date=` 時等待 `/trading-date`，有 `?date=` 時立即 ready）
- [x] 4.2 確認 mock `DashboardStateService` 含 `dateReady` signal 與 `setDateReady()` 的元件測試仍通過
