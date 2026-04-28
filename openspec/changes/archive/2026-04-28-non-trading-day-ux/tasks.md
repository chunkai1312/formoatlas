## 1. 移除 DashboardStateService 的 dateReady 機制

- [x] 1.1 移除 `DashboardStateService` 的 `dateReady = signal<boolean>(false)` 與 `setDateReady()` 方法
- [x] 1.2 確認並移除所有引用 `dateReady` / `setDateReady()` 的地方（`AppComponent`、測試 mock）

## 2. 修改 AppComponent 啟動邏輯

- [x] 2.1 移除 `AppComponent.ngOnInit()` 中呼叫 `state.setDateReady()` 的行
- [x] 2.2 移除 `AppComponent` template 中 `@if (dateReady())` gate，讓 `<router-outlet>` 始終渲染
- [x] 2.3 新增 `bannerLatestDate = signal<string | null>(null)` 至 `AppComponent`
- [x] 2.4 `ngOnInit()` 背景呼叫 `/trading-date?before=today`；若 `result.date < today` 則設定 `bannerLatestDate(result.date)`，不修改 `selectedDate`

## 3. 新增 Non-Trading-Day Banner UI

- [x] 3.1 在 `AppComponent` template 中，Toolbar 下方條件渲染橫幅：`@if (bannerLatestDate())` 顯示「今日行情尚未更新」與「查看最近交易日 →」按鈕
- [x] 3.2 點擊按鈕呼叫 `state.setDate(bannerLatestDate())`，並將 `bannerLatestDate` 清為 `null`（橫幅消失）
- [x] 3.3 套用橫幅樣式（配合現有 dark mode，使用 `info` 色調或 `mat-toolbar` secondary）

## 4. 修改 ToolbarComponent 日期切換邏輯

- [x] 4.1 移除 `prevDay()` 中週末跳過的條件邏輯
- [x] 4.2 移除 `nextDay()` 中週末跳過的條件邏輯（若有）
- [x] 4.3 確認 `isToday()` 的停用條件仍正確（`selectedDate === today`）

## 5. 更新測試

- [x] 5.1 更新 `AppComponent` 測試：移除 `dateReady` 相關斷言，加入 banner 顯示邏輯測試
- [x] 5.2 更新 `ToolbarComponent` 測試：移除週末跳過相關測試 case
- [x] 5.3 更新所有 mock `DashboardStateService` 中的 `dateReady` / `setDateReady` 引用

## 6. 前端日期過濾（非交易日資料隔離）

- [x] 6.1 `TickerService.getSectorFlow()`：加 `map()` 過濾，回傳 `date !== requestedDate` 的項目全部移除，結果為 `[]`
- [x] 6.2 `TickerService.getHotStocks()`：加 `map()` 過濾，若回傳 `date !== requestedDate` 回傳空結構（所有排行陣列為 `[]`）
- [x] 6.3 `TickerService.getMarketMap()`：加 `map()` 過濾，若回傳 `date !== requestedDate` 回傳 `{ sectors: [] }`
- [x] 6.4 `KlineChartComponent`：新增 `isNonTradingDay` computed（`rawData` 最後一筆 date ≠ `endDate` 時為 true）；`chartOption` 在非交易日回傳 `null`
- [x] 6.5 `KlineChartComponent.displayMaValues`：非交易日時回傳全 null，避免 MA 均線仍顯示數值
- [x] 6.6 `DashboardComponent.getMarketStats()`：新增 `marketStatsLoading` signal；收到結果後比對最後一筆 `date` 與 `selectedDate`，不符時清空 `marketStatsData` 與 `todayStats`
- [x] 6.7 `StatsOverviewComponent`：新增 `loading` input；template 區分「載入中」、「此日期無資料」、「有資料」三種狀態
