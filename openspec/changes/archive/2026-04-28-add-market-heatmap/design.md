## Context

首頁定位為「每日市場地圖」，但目前缺乏視覺化全景。現有技術棧：
- **後端**: NestJS + MongoDB (Mongoose)，`Ticker` collection 已存每日個股 OHLCV
- **前端**: Angular standalone components，`ngx-echarts ^21.0.0` 已安裝
- **資料缺口**: `Ticker` 不含個股產業分類（`industry`）與發行股數（`issuedShares`），兩者是熱力圖矩形大小（市值）的必要依據

`node-twstock` 提供：
- `stocks.list()` → `{ symbol, type, industry: "21", ... }` 靜態產業代碼
- `stocks.finiHoldings({ date, exchange })` → `{ symbol, issuedShares, ... }` 每日發行股數（假日回 null）

## Goals / Non-Goals

**Goals:**
- 在首頁三張卡片下方渲染一張全 TSE / OTC 普通股的 treemap 熱力圖
- 矩形大小由市値驅動，顏色由漲跨幅（紅漲綠跨）驅動
- Hover tooltip 顯示個股 OHLCV，開高低收各自依參考價標色
- 後端提供乾淨的階層化 API，前端不做 join 邏輯
- 熱力圖色階、tooltip、個股標籤顏色支援深色與淡色模式

**Non-Goals:**

- 點擊個股的導覽互動
- ETF / 基金 / 其他非普通股類型
- 市值的即時精確性（使用每日收盤計算即可）

## Decisions

### D1: 新增 Equity collection 而非擴充 Ticker

**決定**: 新增獨立的 `Equity` collection，儲存 `symbol`、`exchange`、`industryCode`、`issuedShares`。

**理由**: `Ticker` 是每日時序資料，`industry` 和 `issuedShares` 是幾乎不變的靜態屬性，兩者生命週期不同。若存入 `Ticker`，每日所有記錄都帶一份相同的靜態值，既冗餘又增加 migration 複雜度。`Equity` 可視為 dimension table，以 `symbol + exchange` 為 unique key，cron 每日 upsert。命名選用 `Equity` 而非 `Stock` 或 `StockInfo`，因為此 collection 的定義性約束即為「只存普通股」，且與現有 `TickerType.Equity` 語言一致，MongoDB 複數化為 `equities`。

**替代方案考量**: 擴充 `Ticker` schema → 需要回填歷史資料，且每日 ~950 筆都重複同一個 `industry`，不划算。

---

### D2: issuedShares 使用「最近一次有效值」的 fallback

**決定**: `finiHoldings` 假日/非交易日回 null 時，cron job 不執行 `issuedShares` 欄位的 upsert，保留 MongoDB 中現有值。

**理由**: 發行股數短期內不會改變，使用最近一次有效值誤差極小（股本異動為偶發性事件）。這比「每次計算時做 date fallback 查詢」更簡單，且不需要在 `Equity` 儲存歷史紀錄。

---

### D3: API 回傳預先組好的階層結構

**決定**: `GET /marketdata/market-map` 在後端完成 join + 階層化，直接回傳 `{ sectors: [{ name, stocks: [...] }] }`。

**理由**: 前端不應承擔 join 邏輯。後端有直接查 MongoDB 的能力，join 成本低（~950 筆），且有利於未來快取。

---

### D4: 矩形大小的 fallback

**決定**: 若 `Equity` 中無 `issuedShares`，個股 `marketCap` fallback 為 `tradeValue`（當日成交值）。

**理由**: 避免部分股票因缺少靜態資料而在 treemap 中消失。成交值雖不等於市值，但能維持「有東西可以顯示」的使用者體驗。

---

### D5: 產業代碼 → 中文名稱的映射

**決定**: 在後端硬編碼一份 `industryCode → industryName` 靜態對照表（對應 TWSE 官方類股分類）。

**理由**: TWSE 產業分類極少變動，無需資料庫化。`stocks.list()` 只提供代碼（如 `"21"`），需要映射才能顯示「半導體」等中文名稱。這份表可從現有 `Index` enum 推導。

---

### D6: 前端使用 ngx-echarts treemap，不新增依賴

**決定**: 使用已安裝的 `ngx-echarts ^21.0.0` + ECharts 內建 `treemap` chart type。

**理由**: 零新依賴、bundle size 無額外成本、ECharts treemap 支援 drill-down、自訂 tooltip、顏色映射等所需功能。

---

### D7: ECharts treemap 顏色映射使用 value 陣列形式

**決定**: 個股節點的 `value` 為 `[marketCap, changePercent]` 陣列，配合 `visualMap.dimension: 1` 來連結漲跌幅與色階。

**理由**: ECharts treemap 的 `colorMappingBy: 'value'` 對映 `value[0]`（矩形大小），這會導致市值幾十億的數字全部映射到色階最大值，結果所有矩形同色。改用 `visualMap.dimension: 1` 將第二維（changePercent）連結色階，是正確做法。

---

### D8: 熱力圖色階分深色與淺色模式

**決定**: `computed` signal 讀取 `isDark()`，分別套用兩組色階常數。深色模式用點亮山綠色到深暗色再到鮮紅；淺色模式用中綠薄荷到近白至珊瑚紅。

**理由**: 深色背景下淡色失對比，淺色背景下深點亮山色過於沉重。兩套色階分別最佳化，同時 `computed` 中已讀取 `isDark()` signal，主題切換時圖表會自動重算。

---

### D9: Tooltip 開高低收依參考價標色

**決定**: 參考價（昨收）= `closePrice − change`，其中 `change = close × changePercent ÷ (100 + changePercent)`。開高低收個別與參考價比較，高於則紅、低於則綠、相等則預設色。

**理由**: 台股報價顏色標注就是以參考價為基準。雖然整體是漲停，但開高低也可能與收盤方向不同（如高殺低走），不能一律套用同色。

## Risks / Trade-offs

**[資料延遲]** `Equity` collection 需要 cron 執行後才有初始資料，首次部署後須手動觸發或等隔天 → 提供手動觸發的 API 或在初始化時同步執行一次。

**[issuedShares 準確性]** 股本異動日（如現金增資）當天熱力圖的市值會偏低，直到 finiHoldings 更新 → 接受，這是每日收盤後更新的資料，誤差視窗只有一天。

**[API 效能]** `market-map` endpoint 每次需 join ~950 筆 Ticker + ~950 筆 Equity → MongoDB aggregate pipeline，加上 `Ticker` 現有 `{ type, market, date }` compound index，查詢成本可控。

**[treemap label 可讀性]** 小市值股票矩形面積小，名稱顯示不完整 → ECharts 內建 `label.overflow: 'truncate'`，tooltip hover 補足資訊。

## Migration Plan

1. 部署後端：新增 `Equity` schema、repository、`market-map` endpoint
2. 手動執行一次 `updateTwseEquityProfiles(date)` 初始化 TSE 資料
3. 手動執行一次 `updateTpexEquityProfiles(date)` 初始化 OTC 資料
4. 部署前端：新增 `MarketMapComponent`，整合進首頁（含上市/上櫃 tab）
5. 無 schema migration（新 collection，現有資料不受影響）

**Rollback**: 前端移除 `<app-market-map>` tag 即可下架，後端 endpoint 可靜默保留。

## Open Questions

- 產業代碼 `"00"` 對應的產業名稱（ETF 使用，已排除，確認無須映射）

> **已確認**: `stocks.list()` 的 type 值為中文字串，普通股為 `"股票"`，其他類型包含 `"ETF"`、`"受益證券-不動產投資信託"`、`"ETN"`、`"上市認購(售)權證"`、`"特別股"`、`"臺灣存託憑證(TDR)"`。過濾條件為 `type === '股票'`。
