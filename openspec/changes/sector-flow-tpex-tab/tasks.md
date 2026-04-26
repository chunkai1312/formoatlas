## 1. API — 擴展 sector-flow endpoint

- [x] 1.1 `GetSectorFlowDto` 新增 `market?: 'TSE' | 'OTC'` 選填欄位（`@IsOptional()`、`@IsIn(['TSE','OTC'])`）
- [x] 1.2 `ticker.repository.ts` `getSectorFlow()` 依 `market` 參數切換 `Market.TSE` / `Market.OTC` 查詢
- [x] 1.3 OTC 模式排除 `Index.TPEX`（IX0043）及 `Index.TPExElectronic`（IX0047）
- [ ] 1.4 手動驗證：`GET /marketdata/sector-flow?date=2026-03-13&market=OTC` 回傳 23 筆，名稱已清理

## 2. 前端 State — 擴展 SectorFlowStateService

- [x] 2.1 新增 `activeMarket = signal<'TSE' | 'OTC'>('TSE')`
- [x] 2.2 新增 computed `benchmarkSymbol`（TSE → `'IX0001'`，OTC → `'IX0043'`）
- [x] 2.3 新增 computed `benchmarkName`（TSE → `'加權指數'`，OTC → `'櫃買指數'`）

## 3. 前端 Service — 更新 TickerService

- [x] 3.1 `getSectorFlow(date, market?: 'TSE' | 'OTC')` 加 `market` 參數，有值才帶入 query params

## 4. 前端 Component — SectorFlowComponent（Tab UI + 資料載入）

- [x] 4.1 template 頂部加「上市 / 上櫃」Tab HTML（`div.tab-bar` + active class binding）
- [x] 4.2 新增 `setMarket(market: 'TSE' | 'OTC')` 方法，更新 `state.activeMarket`
- [x] 4.3 資料載入觸發改為 `combineLatest([endDate$, activeMarket$])`，每次 Tab 切換重新 fetch
- [x] 4.4 確認 Tab 切換後 auto-select 邏輯（selectedSymbol、selectedName、klineSymbol）正確觸發
- [x] 4.5 加 tab-bar CSS（active 樣式、hover、邊框）

## 5. 前端 Component — SectorFlowChartsComponent（基準指數動態化）

- [x] 5.1 `combineLatest` 中加入 `benchmarkSymbol$`，benchmark fetch 改用 `state.benchmarkSymbol()`
- [x] 5.2 eCharts option 中左 Y 軸 `name` 及左側 series `name` 改為 `state.benchmarkName()`
- [x] 5.3 tooltip formatter 中 benchmark series 名稱改為動態
