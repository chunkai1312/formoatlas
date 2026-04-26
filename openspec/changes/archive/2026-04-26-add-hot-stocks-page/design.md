## Context

TaiBaro 目前有兩個主要入口：「大盤籌碼」提供市場整體趨勢，「資金流向」提供產業層級輪動。後端 `Ticker` collection 已保存上市／上櫃個股每日行情與法人進出資料，且 `TickerRepository` 已有接近需求的排行查詢方法：

- `getTopMovers()`：依 `changePercent` 取得漲幅或跌幅排行
- `getMostActives()`：依 `tradeVolume` 或 `tradeValue` 取得成交量值排行
- `getInstInvestorsTrades()`：依 `instInvestors.<inst>.net` 取得法人買賣超排行

因此本變更主要是將既有資料與查詢產品化為「熱門個股」頁面，而不是新增資料收集流程。

## Goals / Non-Goals

**Goals:**
- 新增 `/hot-stocks` 頁面，讓使用者以日期與市場別快速掃描個股排行。
- 沿用「資金流向」頁面的上市／上櫃 Tab 心智模型。
- 提供漲跌幅、成交量值、外資買賣超、投信買賣超排行。
- 後端提供頁面導向的聚合 API，讓前端切換日期或市場時一次取得完整 overview。
- 空資料日與查無資料情境穩定回傳空陣列，不讓頁面或 API crash。

**Non-Goals:**
- 不新增個股 K 線圖、點選列聯動、個股詳情頁或 watchlist。
- 不新增即時盤中資料；沿用目前每日收盤後資料。
- 不調整資料收集 cron 時程。
- 不合併外資與投信為單一「法人合計」排行；第一版分開呈現。

## Decisions

### 1. 使用聚合頁面 API

新增 `GET /marketdata/hot-stocks?date=YYYY-MM-DD&market=TSE|OTC`，一次回傳頁面需要的多組排行。

替代方案是建立多個細 endpoint，例如 `/top-movers`、`/most-actives`、`/institutional-trades`。這與既有 repository method 對齊，但會讓前端在每次日期或市場切換時發出多個 request，並需要在 UI 層處理部分成功、部分失敗的狀態。

聚合 endpoint 較適合這個頁面的 overview 定位。底層仍可重用現有 repository 查詢，避免把排序邏輯散在 controller 或前端。

### 2. 第一版是掃描頁，不是個股分析頁

頁面以多張排行表呈現：

```text
┌──────────────────────────────────────────────┐
│ 上市 | 上櫃                                   │
├──────────────────────────────────────────────┤
│ 漲跌幅排行          成交量值排行              │
│ ┌──────────┐       ┌──────────┐             │
│ │ 漲幅/跌幅 │       │ 量/值     │             │
│ └──────────┘       └──────────┘             │
│                                              │
│ 外資買賣超排行      投信買賣超排行            │
│ ┌──────────┐       ┌──────────┐             │
│ │ 買超/賣超 │       │ 買超/賣超 │             │
│ └──────────┘       └──────────┘             │
└──────────────────────────────────────────────┘
```

這保留「熱門個股」作為每日掃榜入口的速度感，也避免引入「哪一張排行表的選取列驅動哪個圖」的狀態問題。若後續需要個股詳情，可另開 change 設計。

### 3. 外資與投信分開呈現

「外資投信買賣超排行」容易有兩種解讀：合計排行或分開排行。本設計採分開排行：

- 外資買超 / 外資賣超
- 投信買超 / 投信賣超

原因是外資與投信的市場語意不同，合計後可能掩蓋分歧訊號。若未來要做法人合計，可新增一張排行，不取代既有分開視圖。

### 4. 排行列使用共同 row model

API 回傳的每個排行 row 使用共同欄位集合，例如：

- `symbol`
- `name`
- `date`
- `market`
- `closePrice`
- `change`
- `changePercent`
- `tradeVolume`
- `tradeValue`
- `finiNet`
- `sitcNet`

不同排行表只顯示其中相關欄位。這讓前端可以用共用表格元件或輕量 wrapper 組裝，並避免每種排行都有不同 DTO。

### 5. 日期語意沿用 `$lte date`

與 `sector-flow` 一致，若指定日期沒有交易資料，API 查詢最近一個小於等於該日期且有資料的交易日。Response 需要帶回實際資料日期，讓前端能在需要時顯示資料來源日期。

### 6. 上櫃權證在資料寫入前排除

上櫃權證不應進入熱門個股資料集。實作採資料層策略：

- TPEx 個股收盤行情更新時，入庫前排除權證 symbol
- TPEx 法人進出更新時，入庫前排除權證 symbol
- 既有資料透過 migration script 清理
- Hot stocks API 查詢層不再額外套用權證 symbol filter，避免同一個業務規則分散在寫入與讀取兩端

## Risks / Trade-offs

- **排行 query 會依多個欄位排序** → 第一版資料量可接受；若未來 response latency 明顯增加，再為 `changePercent`、`tradeVolume`、`tradeValue`、`instInvestors.*.net` 補查詢索引。
- **現有 repository method 查無資料可能對 `undefined.slice()` 出錯** → 實作時補強空結果處理，所有排行在無資料時回傳 `[]`。
- **成交量單位可能因資料來源而不直覺** → UI 文案需依實際 `node-twstock` 欄位確認後標示；成交值建議沿用「億」格式化。
- **migration 未執行前 API 仍可能讀到既有上櫃權證資料** → 部署時需執行 `remove-otc-warrants.js`；未來資料由入庫前過濾防止再次寫入。
- **TopBar 第三個連結在小螢幕可能擁擠** → 第一版維持現有導覽樣式；若寬度不足，實作時需至少確保不重疊，可用 wrap、縮小 gap 或水平捲動處理。
