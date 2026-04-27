## Why

產業資金流向頁目前以排行表作為第一個主要資訊區塊。表格欄位完整、可排序，但使用者需要逐列掃描，才能理解當日成交金額集中在哪些產業、前幾名差距有多大，以及上市/上櫃市場是否呈現高度集中。

在表格上方新增「成交比重分佈」摘要圖，可以先提供一個可掃描的市場資金分佈輪廓，再讓使用者往下進入完整表格與明細圖。

## What Changes

- 在 `/sector-flow` 的「產業資金流向」區塊中，於排行表上方新增成交比重分佈圖。
- 分佈圖使用既有 `SectorFlowSnapshot` 資料，不新增 API。
- 分佈圖以成交比重 `tradeWeight` 降冪呈現前 10 筆產業。
- 每列顯示產業名稱、成交比重與比重差。
- 點擊圖中的產業列後，同步更新 `selectedSymbol`、`selectedName` 與 `klineSymbol`，使下方資金流向明細與產業 K 線一起切換。
- 保留排行表的完整欄位、排序與純展示定位。

## Impact

- Affected specs: `sector-money-flow`
- Affected code:
  - `apps/web/src/app/features/sector-flow/sector-flow.component.*`
  - `apps/web/src/app/features/sector-flow/sector-flow-state.service.ts`
  - 新增成交比重分佈圖 component（建議放在 `features/sector-flow/components/`）
- No API changes
- No database changes
