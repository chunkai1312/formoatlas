## 1. 型別擴充

- [x] 1.1 在 `dashboard-state.service.ts` 的 `TimeRange` 聯合型別加入 `'2Y'`
- [x] 1.2 在 `RANGE_MONTHS` 物件加入 `'2Y': 24`

## 2. 週K 聚合邏輯

- [x] 2.1 在 `kline-chart.component.ts` 新增 `aggregateToWeekly(data: TickerOhlc[]): TickerOhlc[]` 純函式：用 Luxon `weekYear-weekNumber` 分組，OHLC 依 D1 設計規則聚合
- [x] 2.2 新增 `weeklyData = computed<TickerOhlc[]>(() => aggregateToWeekly(this.rawData()))` signal

## 3. chartInterval Signal 與 Fetch 視窗

- [x] 3.1 新增 `chartInterval = signal<'D'|'W'>('D')`
- [x] 3.2 將 constructor 裡的 fetch 管道改為 `combineLatest([toObservable(this.state.endDate), toObservable(this.chartInterval)])`
- [x] 3.3 fetch 視窗根據 `chartInterval`：`'D'` → 12 個月，`'W'` → 24 個月

## 4. ranges Computed 與 localRange Fallback

- [x] 4.1 將 `readonly ranges: TimeRange[]` 改為 `readonly ranges = computed<TimeRange[]>(() => this.chartInterval() === 'W' ? ['3M', '6M', '1Y', '2Y'] : ['1M', '3M', '6M', '1Y'])`
- [x] 4.2 新增 `setChartInterval(interval: 'D'|'W')` 方法，切換前先做 localRange fallback：若 `localRange()` 不在新 ranges 內，自動 set 為 `'3M'`（切至週K）或 `'1Y'`（切至日K）

## 5. filteredData 根據 interval 選擇資料來源

- [x] 5.1 修改 `filteredData = computed<TickerOhlc[]>()` 的資料來源：`chartInterval() === 'W'` 時取 `this.weeklyData()`，否則取 `this.rawData()`

## 6. UI：切換按鈕

- [x] 6.1 在 `kline-chart.component.html` 卡片標題列新增 `[日K][週K]` 切換按鈕，樣式與現有 range 按鈕對齊（active 樣式標示目前選取）
- [x] 6.2 按鈕 click 呼叫 `setChartInterval('D')` / `setChartInterval('W')`
- [x] 6.3 range 按鈕改為使用 `ranges()` computed（`@for` 迴圈）以支援動態選項
