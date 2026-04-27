## Why

熱門個股頁的外資／投信買賣超排行目前只顯示單日淨買賣超數字，無法讓使用者快速判斷法人是否持續積累或持續出清。加入「連 n 買／賣」與「轉買／轉賣」badge，可在不增加欄位的情況下，幫助使用者識別法人連續動向的強度與方向轉折。

## What Changes

- `Ticker` 文件的 `InstInvestors` 結構新增 `consecutiveDays` 欄位（正值 = 連買天數，負值 = 連賣天數，0 = 無方向），外資（`fini`）與投信（`sitc`）各自計算
- 每日 ingestion pipeline（TSE & OTC 個股法人進出）在寫入 `Ticker` 時，查詢前一交易日同 symbol 的 `consecutiveDays` 並計算新值
- 提供 migration script 對歷史 `Ticker` 資料補算 `fini.consecutiveDays` 與 `sitc.consecutiveDays`
- `GET /marketdata/hot-stocks` response 每個 row 新增 `finiConsecutiveDays` 與 `sitcConsecutiveDays` 欄位
- 熱門個股頁外資買超／賣超排行與投信買超／賣超排行，在股票名稱旁以 badge 形式呈現：
  - `consecutiveDays = +1`：「轉買」badge（紅色系）
  - `consecutiveDays ≥ +2`：「連 n 買」badge（紅色系）
  - `consecutiveDays = -1`：「轉賣」badge（綠色系）
  - `consecutiveDays ≤ -2`：「連 n 賣」badge（綠色系）
  - `consecutiveDays = 0`：無 badge

## Capabilities

### New Capabilities

- `institutional-consecutive-days`：定義法人連續買賣超天數的計算規則、資料結構、API 欄位與前端 badge 顯示行為

### Modified Capabilities

- `hot-stocks`：外資／投信買賣超排行表新增連續天數 badge 顯示需求

## Impact

- **API**：`apps/api/src/app/marketdata/repositories/ticker.repository.ts` — `getEquityRanking` 新增投影欄位；ingestion service 新增連續天數計算邏輯
- **Schema**：`apps/api/src/app/marketdata/schemas/ticker.schema.ts` — `InstitutionalTrade` 新增 `consecutiveDays`
- **Migration**：新增 script 補算歷史資料
- **Web**：`apps/web/src/app/features/hot-stocks/` — 排行表 row component 新增 badge 顯示
- **Types**：`HotStockRankRow` type 新增 `finiConsecutiveDays`、`sitcConsecutiveDays`
