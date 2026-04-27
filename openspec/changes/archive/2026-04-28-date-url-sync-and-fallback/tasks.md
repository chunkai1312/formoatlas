## 1. API：新增 trading-date endpoint

- [x] 1.1 在 `MarketStatsRepository` 新增 `getLatestTradingDate(before: string): Promise<{ date: string } | null>` 方法（`findOne({ date: { $lte: before } }).sort({ date: -1 })`）
- [x] 1.2 在 `MarketDataController` 新增 `GET /trading-date` endpoint，接收 `before` query param，呼叫上方方法，無結果時回傳 404
- [x] 1.3 新增對應 DTO（`GetTradingDateDto`，`before` 為選填字串）

## 2. Frontend Service：DashboardStateService URL 同步

- [x] 2.1 在 `DashboardStateService` 注入 `Router`
- [x] 2.2 修改 `setDate()` 加入 `router.navigate([], { queryParams: { date }, queryParamsHandling: 'merge', replaceUrl: true })`
- [x] 2.3 新增 `dateReady = signal<boolean>(false)` 與 `setDateReady()` 方法
- [x] 2.4 新增前端 `TradingDateService`（`GET /api/marketdata/trading-date?before=<date>`）

## 3. Frontend Init：AppComponent 啟動初始化

- [x] 3.1 `AppComponent` 注入 `ActivatedRoute`、`DashboardStateService`、`TradingDateService`
- [x] 3.2 `ngOnInit()` 讀取 `snapshot.queryParams['date']`，若非合法 ISO 日期則 fallback 為今日
- [x] 3.3 呼叫 `TradingDateService.getLatestTradingDate(before)` 取得最近交易日
- [x] 3.4 收到回應後呼叫 `state.setDate(date)` 與 `state.setDateReady()`
- [x] 3.5 template 中以 `@if (state.dateReady())` 包住 `<router-outlet>`，未就緒時顯示 loading spinner

## 4. 清理：移除 DashboardComponent 副作用

- [x] 4.1 刪除 `DashboardComponent` 中的 `dateInitialized` 欄位及首次載入後呼叫 `state.setDate()` 的邏輯
