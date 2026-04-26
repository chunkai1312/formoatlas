## Context

資金流向頁（`/sector-flow`）目前只支援上市（TSE）產業，資料來源為 `GET /marketdata/sector-flow`，後端 query 寫死 `market: Market.TSE`。前端 `SectorFlowStateService` 管理 `selectedSymbol`、`selectedName`、`klineSymbol`、`sectors` 等 signal；`SectorFlowComponent` 監聽 `dashState.endDate` 觸發資料載入。`SectorFlowChartsComponent` 的基準指數目前硬編碼為 `IX0001`（加權指數）。

---

## Goals / Non-Goals

**Goals:**
- 頁面頂部加 UI Tab（上市 / 上櫃），切換後三個 section 聯動更新
- API 新增 `market` 選填 query param，OTC 回傳上櫃產業，向下相容
- 上櫃模式下資金流向明細圖基準指數改為 IX0043（櫃買指數）
- Tab 切換後重新 auto-select changePercent 最高產業

**Non-Goals:**
- RS 欄位（API 計算但前端不使用，維持現狀）
- 同時顯示兩個市場（不做上下堆疊 / 並排）
- URL routing 反映市場狀態

---

## Decisions

### D1：API 擴展方式 — 單一 endpoint 加 `market` param

**選擇**：在現有 `GET /marketdata/sector-flow` 加 `market?: 'TSE' | 'OTC'` query param，預設 `TSE`。

**備選**：新開 `/sector-flow/tpex` endpoint。  
**理由**：邏輯幾乎相同，只有 market filter 和 excludedSymbols 不同，共用一個 repository method 更簡潔，也避免重複的 DTO / Swagger 定義。

---

### D2：OTC 排除清單

```
IX0043 TPEX           ← 整體基準指數，不作為產業呈現
IX0047 TPExElectronic ← 電子子類的聚合（類比 TSE 的 IX0027）
```

其餘 23 個 OTC 指數全部顯示。

---

### D3：前端狀態管理 — 在 SectorFlowStateService 集中管理市場狀態

**新增 signal**：
```ts
activeMarket = signal<'TSE' | 'OTC'>('TSE')

// computed
benchmarkSymbol = computed(() =>
  this.activeMarket() === 'TSE' ? 'IX0001' : 'IX0043'
)
benchmarkName = computed(() =>
  this.activeMarket() === 'TSE' ? '加權指數' : '櫃買指數'
)
```

`SectorFlowComponent` 將資料載入觸發從 `toObservable(endDate)` 改為 `combineLatest([endDate, activeMarket])`，Tab 切換後自動重新 fetch 並 auto-select。

`SectorFlowChartsComponent` 將 `'IX0001'` 及 `'加權指數'` 硬編碼分別改為讀 `state.benchmarkSymbol()` 和 `state.benchmarkName()`。

---

### D4：Tab UI — 原生實作，不引入 Angular Material Tabs

**理由**：避免引入額外的 Material 元件，Tab 結構簡單，直接以 `<div class="tab-bar">` + active CSS class 實作，與現有 range-btn 模式一致。

---

## Risks / Trade-offs

- **OTC 資料缺漏**：若上櫃指數在 DB 中缺少特定交易日資料，API 回傳空陣列；前端目前已有 `catchError(() => of([]))` 保護，排行表會顯示空白。可接受。
- **切換 Tab 重新 fetch**：每次切換都觸發一次 API call，無快取。考量使用頻率低，不做 memoization，維持簡單。
- **`SectorFlowChartsComponent` 的 `benchmarkSymbol` 響應式**：`combineLatest` 已包含 `selectedSymbol`，Tab 切換 → `selectedSymbol` 更新 → chart 自動重新 fetch 基準指數，流程正確，不需額外處理。
