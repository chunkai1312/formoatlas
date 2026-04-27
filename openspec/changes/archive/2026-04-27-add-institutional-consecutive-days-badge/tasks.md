## 1. Schema & Types

- [x] 1.1 在 `InstitutionalTrade` schema 新增 `consecutiveDays?: number` 欄位（`ticker.schema.ts`）。
- [x] 1.2 在 `HotStockRankRow` interface 新增 `finiConsecutiveDays: number | null` 與 `sitcConsecutiveDays: number | null`（`hot-stocks.types.ts`）。

## 2. Ingestion — Consecutive Days 計算

- [x] 2.1 在 `TickerRepository` 新增 `getPrevInstConsecutiveDays(symbol, beforeDate, market)` 方法，查前一交易日同 symbol 的 `instInvestors.fini.consecutiveDays` 與 `sitc.consecutiveDays`（利用現有 `{ date: -1, symbol: 1 }` 索引）。
- [x] 2.2 在 `updateTwseEquitiesInstInvestorsTrades` 計算完 `fini.net` / `sitc.net` 後，呼叫 2.1 取得前一日值，依計算規則算出 `consecutiveDays` 並寫入 upsert payload。
- [x] 2.3 對 `updateTpexEquitiesInstInvestorsTrades` 套用相同修改。

## 3. API — Hot Stocks Response

- [x] 3.1 在 `getEquityRanking` 的 `$project` 階段新增 `finiConsecutiveDays: { $ifNull: ['$instInvestors.fini.consecutiveDays', null] }` 與 `sitcConsecutiveDays: { $ifNull: ['$instInvestors.sitc.consecutiveDays', null] }`。

## 4. Migration

- [x] 4.1 新增 migration script `migrate-consecutive-days.js`，依 `(market, symbol, date)` 升冪掃描所有有 `instInvestors` 的 `Ticker` 文件，逐日補算 `fini.consecutiveDays` 與 `sitc.consecutiveDays` 並 bulk write。

## 5. 前端 — Badge 元件

- [x] 5.1 在熱門個股排行 row 模板（外資買超、外資賣超、投信買超、投信賣超）中，依 `finiConsecutiveDays` / `sitcConsecutiveDays` 值在股票名稱右側顯示 badge：`+1`→轉買、`≥+2`→連 n 買、`-1`→轉賣、`≤-2`→連 n 賣、`0/null`→無。
- [x] 5.2 「轉買」/「轉賣」使用 outline 樣式；「連 n 買」/「連 n 賣」使用 filled 樣式，色系沿用既有台股紅（漲）綠（跌）token。
- [x] 5.3 確認漲跌幅排行與成交量值排行不顯示此 badge。

## 6. Verification

- [x] 6.1 執行 web build，確認無 TypeScript 錯誤。
- [x] 6.2 執行 `openspec validate add-institutional-consecutive-days-badge --strict`。
