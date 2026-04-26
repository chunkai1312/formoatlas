## Why

使用者目前可以在「大盤籌碼」觀察整體市場、在「資金流向」觀察產業輪動，但缺少每日個股層級的快速掃描入口。既有資料收集已包含上市／上櫃個股行情與外資、投信、自營商買賣超資料，適合新增「熱門個股」頁面，讓使用者用同一套日期與市場脈絡查看個股排行。

## What Changes

- TopBar 新增「熱門個股」導覽連結，連至 `/hot-stocks`，並維持既有 active pill 樣式。
- 新增 `/hot-stocks` 頁面，參照資金流向頁的上市／上櫃 Tab 呈現方式，切換後更新所有排行。
- 新增熱門個股頁面 API，一次回傳指定日期與市場的多組排行：
  - 漲跌幅排行：漲幅榜、跌幅榜
  - 成交量值排行：成交量排行、成交值排行
  - 外資投信買賣超排行：外資買超／賣超、投信買超／賣超
- 第一版定位為個股掃描 overview，不加入個股 K 線或跨排行列點選聯動。
- 無 breaking changes；既有大盤籌碼與資金流向頁行為維持不變。

## Capabilities

### New Capabilities
- `hot-stocks`: 熱門個股 API 與頁面需求，涵蓋上市／上櫃切換、多組個股排行、回傳欄位、排序與空資料行為。

### Modified Capabilities
- `topbar-navigation`: 新增「熱門個股」導覽連結與 `/hot-stocks` lazy-load route。

## Impact

- **API**: `MarketDataController` 新增熱門個股 endpoint；`TickerRepository` 可重用既有 top movers、most actives、institutional trades 查詢，並補強空資料日行為。
- **前端路由與導覽**: `app.routes.ts` 新增 `/hot-stocks` lazy-load route；`toolbar.component` 新增導覽連結。
- **前端頁面**: 新增 HotStocks page、state/service/model 與排行表元件；沿用現有 DashboardStateService 日期。
- **資料來源**: 使用既有 `Ticker` collection 欄位：`changePercent`、`tradeVolume`、`tradeValue`、`instInvestors.fini.net`、`instInvestors.sitc.net`。
