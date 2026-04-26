## Context

`KlineChartComponent` 目前以日K顯示加權指數（IX0001），fetch 1Y 日K資料快取於 `rawData` signal，並透過 `filteredData` computed 對 `localRange` 進行前端 slice。MA 值用全量 1Y 資料計算後再 slice，避免 warmup 缺口。

週K 是對日K資料的時間粒度重新聚合，與後端 API 無關，可純前端實作。

## Goals / Non-Goals

**Goals:**
- 新增 `[日K][週K]` 切換按鈕於 KlineChartComponent 卡片標題列
- 週K 由前端聚合日K資料產生（無後端異動）
- 週K 使用 2Y fetch 視窗，range 選項為 `[3M][6M][1Y][2Y]`
- `TimeRange` 型別加入 `'2Y'`

**Non-Goals:**
- 月K 或其他時間粒度
- 後端新增 `interval` 參數
- 週K MA 換不同定義（沿用日K MA5/10/20/60/120/240）

## Decisions

### D1：週K 資料在前端聚合，不改後端
**決策**：加入 `weeklyData = computed()` 在元件內聚合。

**理由**：後端 `getOhlcBySymbol` 只負責查詢，聚合邏輯留在前端符合現有模式（`filteredData`、`maData` 都是 computed）。週K只是視窗大小與聚合粒度的轉換，概念上是「前端 group-by week」。

**聚合規則**：
- 分組 key = Luxon `weekYear-weekNumber`（週一為起始）
- `date` = 該週最後一個交易日日期（作為 X 軸 label）
- `open` = 該週第一個交易日的 openPrice
- `high` = max(highPrice)
- `low` = min(lowPrice)
- `close` = 該週最後一個交易日的 closePrice
- `tradeValue` = sum(tradeValue)

### D2：週K 時 fetch 視窗擴為 2Y，透過 chartInterval signal 觸發
**決策**：`chartInterval = signal<'D'|'W'>('D')`，fetch 管道改為 `combineLatest([endDate$, chartInterval$])`，視窗根據 interval 決定（`'D'` → 12 個月，`'W'` → 24 個月）。

**理由**：延伸現有 reactive 模式，`switchMap` 自動取消舊請求。不需新增 service 方法，只改 fetch 的查詢參數。

### D3：週K 的 ranges 是 computed，localRange 切換時做 fallback
**決策**：
```typescript
readonly ranges = computed(() =>
  this.chartInterval() === 'W' ? ['3M', '6M', '1Y', '2Y'] : ['1M', '3M', '6M', '1Y']
);
```
切換 interval 時，若 `localRange()` 不在新的 ranges 內（如 `'1M'` 切至週K），自動 fallback 為 `'3M'`。

**理由**：保持 localRange 有效性，避免圖表顯示空資料。

### D4：`filteredData` 根據 interval 選擇資料來源
**決策**：
```
interval='D' → filteredData 從 rawData slice
interval='W' → filteredData 從 weeklyData slice
```
`weeklyData` 只在 `rawData` 變化時重新計算，與 `filteredData` 的 slice 邏輯分離。

## Risks / Trade-offs

- **週K 當週未完整**：當週尚未收盤時，該週最後一個交易日不一定是週五，此為合理行為——分組以`實際交易日`為準，無需特殊處理
- **MA warmup in weekly**：MA 仍用 `rawData`（日K全量）計算，再聚合後取 `offset`。週K MA 值 = 對應週最後一日的 MA 值（與日K MA 語義一致但數值不同），接受此 trade-off
- **2Y fetch 量約兩倍**：每次切至週K會多傳一倍資料；可接受，OHLC 資料量小

## Migration Plan

純前端變更，無後端資料 schema 異動，無移轉計畫。

## Open Questions

- 無
