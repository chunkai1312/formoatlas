## Context

FormoAtlas 目前每日保存原始 `Ticker` OHLC 資料，前端 Dashboard / 個股頁 K 線與會員回測都直接使用 `TickerRepository.getOhlcBySymbol()`。這套資料在短期行情閱讀上足夠，但長期價格序列會受到除權息、減資、股票面額變更與 ETF 分割/反分割影響，產生非市場交易造成的跳空。

`node-twstock` 已提供所需來源：

- `stocks.dividends()`：除權息。
- `stocks.capitalReductions()`：普通股減資。
- `stocks.splits()`：股票面額變更。
- `stocks.etfSplits({ reverseSplit: false })`：ETF 分割。
- `stocks.etfSplits({ reverseSplit: true })`：ETF 反分割。

本設計保留原始行情，另建中性的 `PriceAdjustmentEvent` 資料層，查詢時再依需求產生還原 OHLC。

## Goals / Non-Goals

**Goals:**

- 建立可追溯的價格調整事件資料表，保存 normalized event、預先計算 factor 與 raw source。
- `GET /marketdata/tickers` 以 `adjusted=true` 回傳向後還原 OHLC，預設維持原始 OHLC。
- 回測一律使用還原 OHLC，降低除權息等事件造成的策略誤判。
- 個股頁 K 線提供原始 / 還原切換。
- 初始化同步近 10 年調整事件，之後每日增量更新。

**Non-Goals:**

- 不改寫既有 `Ticker` collection 的原始 OHLC。
- 第一版不調整 `tradeVolume`、`tradeValue` 或成交筆數。
- 第一版不支援前還原、總報酬指數或股利再投入模型。
- 不對大盤指數做價格還原；指數查詢帶 `adjusted=true` 時仍回原始 OHLC。
- 不建立使用者可編輯或手動修正調整事件的後台。

## Decisions

### Decision 1: 使用 `PriceAdjustmentEvent` 而非 `CorporateAction`

**選擇**：新增中性命名的 `PriceAdjustmentEvent` schema/repository/service。

**原因**：來源事件包含 ETF 分割/反分割，不全是公司行動。`PriceAdjustmentEvent` 清楚表示「會改變價格序列連續性的事件」，同時適用普通股與 ETF。

**替代方案**：`CorporateAction` 語意偏普通股；`AdjustmentFactor` 又過度聚焦計算結果，無法完整表達事件來源。

建議資料形狀：

```ts
type PriceAdjustmentEvent = {
  symbol: string;
  exchange: 'TWSE' | 'TPEx';
  market: 'TSE' | 'OTC';
  eventType:
    | 'dividend'
    | 'capitalReduction'
    | 'faceValueChange'
    | 'etfSplit'
    | 'etfReverseSplit';
  effectiveDate: string;
  previousClose: number;
  referencePrice: number;
  factor: number;
  cashDividend?: number;
  stockDividendShares?: number;
  sharesPerThousand?: number;
  refundPerShare?: number;
  reason?: string;
  raw: Record<string, unknown>;
};
```

索引：

- unique: `{ symbol: 1exchange: 1eventType: 1effectiveDate: 1 }`
- query: `{ symbol: 1effectiveDate: 1 }`
- sync: `{ exchange: 1effectiveDate: 1 }`

### Decision 2: 保存 event factor，但還原 OHLC 查詢時計算

**選擇**：每筆事件同步時預先計算並保存 `factor`，但 adjusted OHLC 不另存成 ticker。

**原因**：保存 factor 方便測試與除錯；不另存 adjusted ticker 可避免同一段歷史資料在 source event 修正後需要同步更新大量 K 棒。

**替代方案**：把 adjusted OHLC 寫回 `Ticker` 或建立 materialized collection。這可提升查詢速度，但會增加回填與重算複雜度；第一版先避免。

### Decision 3: 採向後還原，事件日前價格乘上累積 factor

**選擇**：`adjusted=true` 使用向後還原。最新價格不變，事件日前的歷史 OHLC 乘上累積倍率。

```text
event applies when candle.date < event.effectiveDate
adjusted price = raw price * product(applicable event.factor)
```

factor 規則：

```text
dividend factor =
  (1 - cashDividend / previousClose)
  * (1 / (1 + stockDividendShares / 1000))

capitalReduction factor = referencePrice / previousClose
faceValueChange factor = referencePrice / previousClose
etfSplit factor = referencePrice / previousClose
etfReverseSplit factor = referencePrice / previousClose
```

同一天多筆事件分別保存，計算時相乘。事件當日價格已反映調整，因此只調整 `date < effectiveDate` 的 K 棒。

### Decision 4: `GET /marketdata/tickers` 使用 boolean query `adjusted=true`

**選擇**：擴充既有端點，不新增 parallel endpoint。

**原因**：前端圖表與回測已依賴相同 OHLC shape。用 boolean query 可以維持既有 call sites 預設行為，並讓個股頁用同一個 service 切換資料。

**替代方案**：新增 `/marketdata/adjusted-tickers`。這會讓 API surface 變大，且容易讓後續功能在兩個端點之間分歧。

### Decision 5: 回測一律使用還原 OHLC

**選擇**：`BacktestingService` 取得 OHLC 時固定使用 adjusted path，不提供回測 request 切換。

**原因**：技術指標與回測績效最容易被除權息假跌幅污染。回測 UI/API 會揭露「使用還原股價」，使用者若要看原始價格，應在個股 K 線切換。

### Decision 6: 第一版不調整成交量與成交金額

**選擇**：只調整 OHLC price fields。

**原因**：本次目標是修正價格連續性與回測價格基礎。成交量/成交金額的還原口徑可能因使用情境不同而有爭議，先保留原始交易資訊。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 來源資料修正造成歷史 factor 改變 | 保留 `raw` 與 upsert event；需要時可重新計算查詢結果，不污染原始 OHLC |
| 查詢時計算 adjusted OHLC 增加延遲 | 用 `{ symboleffectiveDate }` 索引查詢相關事件；每次只處理該 symbol 與日期區間附近的事件 |
| `node-twstock` 來源欄位出現 null 或 0 | factor 計算前驗證 `previousClose`、`referencePrice` 與必要欄位；無法計算者不寫入或標記為 invalid 並記錄 warning |
| 大盤指數被誤要求 adjusted | 對非股票/ETF 或沒有事件的 symbol 直接回原始 OHLC |
| 回測結果與使用者看到的原始 K 線不同 | 個股頁提供原始 / 還原切換，回測 warnings 明確標示使用還原股價 |
| 同日多事件難以追查 | 不合併事件，保存每筆 event 與 raw；計算時才相乘 |

## Migration Plan

1. 新增 `PriceAdjustmentEvent` schema/repository/service，註冊於 `MarketDataModule`。
2. 建立同步方法，依 exchange 抓近 10 年除權息、減資、面額變更、ETF 分割與 ETF 反分割資料，upsert 至 collection。
3. 將每日增量同步加入既有 market data 更新流程或獨立 cron。
4. 新增 adjusted OHLC 計算 service，並讓 ticker OHLC 查詢在 `adjusted=true` 時套用。
5. 將 `BacktestingService` 改成固定讀取 adjusted OHLC。
6. 前端 ticker service 支援 `adjusted` 參數；個股頁 K 線加原始 / 還原切換。
7. 以單元測試覆蓋 factor 計算、同日多事件、指數忽略 adjusted、回測使用 adjusted。

Rollback 策略：保留 `adjusted` 預設 false。若事件同步或 adjusted 計算異常，可先停用回測 adjusted path 或讓 `adjusted=true` fallback 原始 OHLC，同時不影響既有原始行情。

## Open Questions

- 是否需要補一個維運用 CLI/script 來指定 symbol/date range 重新同步事件？第一版可先用 service method 與測試覆蓋，實作時視需要加入。
- 是否要在 API response 標示 `adjusted: true` 或 `adjustmentEventsApplied`？目前 proposal 決定維持 OHLC shape，若前端需要除錯資訊可另開 debug endpoint。
