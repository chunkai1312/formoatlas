## Why

首頁定位為「每日市場地圖」，但目前只有三張文字摘要卡片，缺乏視覺化的市場全景。加入個股熱力圖（Treemap）能讓使用者一眼掌握當日整體市場的漲跌分佈與資金集中狀況。

## What Changes

- 新增後端 `Equity` collection，儲存個股的產業分類（industry）與發行股數（issuedShares），支援熱力圖所需的市値計算（TSE + OTC）
- 新增 `GET /marketdata/market-map` endpoint，回傳以產業為父節點、個股為子節點的階層化熱力圖資料，支援 `market` 參數（`TSE` / `OTC`）
- 新增前端 `MarketMapComponent`，使用 ngx-echarts treemap 在首頁三張卡片下方渲染全市場熱力圖
- 熱力圖矩形大小依市値（issuedShares × closePrice），顏色依漲跨幅（台灣慣例：紅漲綠跨）
- 熱力圖的色階支援深色與淡色模式各自最佳化（深色：點窮山 / 淡色：柔和粉紅綠）
- Hover tooltip 顯示個股開、高、低、收、漲、幅、量，開高低收依參考價（昨收）標色
- 首頁熱力圖區塊新增「上市」 / 「上櫃」 tab 切換
- 僅顯示 TSE / OTC 普通股，排除 ETF / 基金

## Capabilities

### New Capabilities

- `market-heatmap`: 市場熱力圖——以產業為父層、個股為子層的 Treemap，矩形大小依市值，顏色依漲跌幅，hover 顯示 OHLCV

### Modified Capabilities

- `market-map-home`: 首頁新增市場熱力圖區塊（三張快照卡片下方）

## Impact

- **後端新增**: `Equity` schema、repository、`updateTwseEquityProfiles` cron job、`updateTpexEquityProfiles` cron job、`market-map` endpoint（支援 TSE / OTC）
- **前端新增**: `market-map` model、service、`MarketMapComponent`，首頁上市/上櫃 tab
- **依賴**: ngx-echarts（已安裝，無新依賴）
- **資料來源**: `node-twstock` 的 `stocks.list()`（產業分類）、`stocks.finiHoldings()`（發行股數），支援 TWSE + TPEx exchange
- **首頁更動**: `HomeComponent` 整合新 component，新增上市/上櫃 tab 切換，`market-map-home` spec 更新
