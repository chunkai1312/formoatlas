## Context

`Ticker` collection 以單日快照結構儲存個股資料，`instInvestors.fini.net` 與 `instInvestors.sitc.net` 只記錄當日淨買賣超數字。目前熱門個股排行（`getEquityRanking`）在 `$project` 階段只取出 `finiNet` / `sitcNet`，沒有任何跨日連續性資訊。

每日 ingestion 分兩條路徑進行：`updateTwseEquitiesInstInvestorsTrades`（TSE）與 `updateTpexEquitiesInstInvestorsTrades`（OTC），各自計算 `fini`、`sitc`、`dealers` 的 buy / sell / net 後 upsert。

## Goals / Non-Goals

**Goals:**
- `InstitutionalTrade` 新增 `consecutiveDays` 欄位，涵蓋 `fini` 與 `sitc`
- Ingestion 計算並寫入 `consecutiveDays`（查前一交易日同 symbol 的舊值後更新）
- `getEquityRanking` 新增 `finiConsecutiveDays` / `sitcConsecutiveDays` 投影
- `HotStockRankRow` type 新增對應欄位
- Migration script 補算所有現有 `Ticker` 歷史資料
- 前端外資／投信買賣超排行表在名稱旁顯示對應 badge

**Non-Goals:**
- 不計算 `dealers.consecutiveDays`（自營商不顯示 badge）
- 不在排行表以外的頁面（如大盤總覽）顯示此 badge
- 不提供 API 以連續天數作為排序或篩選條件

## Decisions

### 1. 儲存在 Ticker document vs 另開 collection

選擇**存在 `Ticker` document 內**（`instInvestors.fini.consecutiveDays`）。

替代方案：另開 `TickerStats` collection 存跨日衍生指標。

選擇前者理由：`consecutiveDays` 是單一衍生欄位，與 `instInvestors` 高度耦合；hot-stocks query 只需一次 aggregate 不需 join；`TickerStats` 目前沒有其他用途，引入會增加維護成本。

### 2. Ingestion 時計算 vs Query 時計算

選擇 **Ingestion 時計算**（寫入時查前一日記錄）。

替代方案：Query 時對每個 top-20 symbol 往回掃描歷史。

選擇前者理由：排行每日只算一次，ingestion 多一次前一日 lookup 成本低；query-time 計算需對每個排行結果（最多 80 個 symbol × 4 個法人排行）各自查歷史，延遲不可控。

### 3. net = 0 的語意

`net = 0` 視為**中斷**，`consecutiveDays` 歸零。

連買期間若某日 net = 0（小幅沖銷），連買計數中斷，隔日重算。語意最清晰，符合台灣投資圈慣例。

### 4. 計算邏輯

```
今日 fini.net > 0：
  prev.consecutiveDays > 0 → consecutiveDays = prev + 1
  otherwise               → consecutiveDays = 1

今日 fini.net < 0：
  prev.consecutiveDays < 0 → consecutiveDays = prev - 1
  otherwise               → consecutiveDays = -1

今日 fini.net = 0：
  consecutiveDays = 0

無前一日記錄：
  consecutiveDays = 1 or -1 or 0（依當日 net 決定）
```

sitc 邏輯相同。

### 5. Badge 顯示規則（前端）

| `consecutiveDays` | Badge | 色系 |
|---|---|---|
| +1 | 轉買 | 紅色 outline |
| ≥ +2 | 連 n 買 | 紅色 filled |
| -1 | 轉賣 | 綠色 outline |
| ≤ -2 | 連 n 賣 | 綠色 filled |
| 0 | 無 | — |

「轉向」badge 使用 outline 樣式，與「連 n」filled 樣式形成視覺區隔，強調前者是方向改變事件，後者是持續強度。

Badge 放在股票名稱右側，不新增獨立欄。

## Risks / Trade-offs

- **Migration 時間**：歷史資料量若大，補算 script 需要從最舊資料開始依日期順序逐日更新。若平行處理需注意依賴順序（每日需要前一日結果）。→ Script 依 `date` 升冪掃描，逐日 batch 更新。
- **ingestion 多一次 lookup**：每次 instInvestors update 需查前一日同 symbol 文件。現有索引 `{ date: -1, symbol: 1 }` 可直接支援此查詢，成本低。
- **前一日資料缺失**：若某 symbol 前一日沒有 instInvestors 資料（首次入庫或資料斷層），視為無前一日記錄，依當日 net 設為 ±1 或 0。
