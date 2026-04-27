## 1. Sector Flow Distribution Summary

- [x] 1.1 新增成交比重分佈圖 component，使用 `SectorFlowSnapshot[]` 作為 input。
- [x] 1.2 分佈圖依 `tradeWeight` 降冪顯示最多 10 筆產業。
- [x] 1.3 每列顯示產業名稱、成交比重與成交比重變化。
- [x] 1.4 長條寬度以最大 `tradeWeight` 為基準計算相對比例，避免單一高比重產業讓其他列不可讀。
- [x] 1.5 比重變化正負使用既有台股漲跌色 token；成交比重長條本身使用中性或 accent 色。

## 2. Interaction

- [x] 2.1 點擊分佈圖產業列時更新 `selectedSymbol` 與 `selectedName`。
- [x] 2.2 點擊分佈圖產業列時同步更新 `klineSymbol`，讓資金流向明細與產業 K 線一起切換。
- [x] 2.3 保留排行表純展示定位，不新增表格列點選互動。

## 3. Layout

- [x] 3.1 將成交比重分佈圖放在「產業資金流向」section 內、排行表上方。
- [x] 3.2 確保 desktop 與 mobile 版面可讀，不讓長產業名稱或百分比文字互相重疊。
- [x] 3.3 保留上市/上櫃 tab 切換後的資料聯動與自動選取行為。

## 4. Verification

- [x] 4.1 新增或更新 sector-flow component tests，覆蓋分佈圖顯示前 10 筆與點擊同步選取。
- [x] 4.2 執行 web tests。
- [x] 4.3 執行 web build。
- [x] 4.4 執行 `openspec validate add-sector-trade-weight-distribution --strict`。

## 5. Interaction Refinement

- [x] 5.1 移除成交比重分佈圖持久 active row 狀態，改以 hover/focus 效果提示可互動。
- [x] 5.2 分佈圖副文說明點選產業會更新下方明細。
- [x] 5.3 下方「資金流向明細」與「產業類股走勢」標題維持穩定，不附加目前選取產業。
