## Why

K 線圖目前只支援日K，無法切換至週K觀察中長期趨勢。加入日K/週K切換，讓用戶可用不同時間粒度分析大盤走勢，週K搭配更長的 2Y 歷史資料，補足日K 1Y視角的不足。

## What Changes

- `KlineChartComponent` 新增 `[日K][週K]` 切換按鈕（卡片標題列，與 range 選擇器並排）
- 週K 由前端對日K資料聚合產生，不新增後端 API
- 週K 時 fetch 視窗擴大為 2Y（日K維持 1Y），切換時以 `switchMap` 重新 fetch
- 週K range 選項改為 `[3M][6M][1Y][2Y]`，日K維持 `[1M][3M][6M][1Y]`
- 切換時若 localRange 在新模式不存在（如日K的 1M 切至週K），自動 fallback 為 3M
- MA 定義沿用日K（MA5/10/20/60/120/240），週K 不換

## Capabilities

### New Capabilities
<!-- 無完全新增的獨立 capability -->

### Modified Capabilities
- `dashboard-kline-chart`: 新增日K/週K 區間切換、週K 聚合邏輯、週K range 選項與 2Y fetch 視窗
- `per-card-time-range`: `TimeRange` 型別擴充加入 `'2Y'`，`RANGE_MONTHS` 新增 `'2Y': 24`

## Impact

- `apps/web/src/app/core/services/dashboard-state.service.ts` — `TimeRange` 加 `'2Y'`，`RANGE_MONTHS` 加 `24`
- `apps/web/src/app/features/dashboard/components/kline-chart/kline-chart.component.ts` — 新增 `chartInterval` signal、`weeklyData` computed、調整 fetch 視窗與 ranges computed、localRange fallback 邏輯
- `apps/web/src/app/features/dashboard/components/kline-chart/kline-chart.component.html` — 新增 `[日K][週K]` 切換按鈕 UI
