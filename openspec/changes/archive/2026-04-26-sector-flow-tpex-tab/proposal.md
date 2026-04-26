## Why

資金流向頁面目前只顯示上市（TSE）產業指數，但上櫃（TPEx）市場有 23 個獨立產業指數，使用者無法在同一頁面查看上櫃產業的資金流向動態。加入市場切換 Tab，讓使用者在不離開頁面的情況下快速切換查看兩個市場。

## What Changes

- 資金流向頁（`/sector-flow`）頂部新增「上市 / 上櫃」Tab，切換後排行表、資金流向明細圖及 K 線圖全部聯動更新
- API `GET /marketdata/sector-flow` 新增 `market` 選填參數（`TSE` | `OTC`），預設維持 `TSE`，向下相容
- 上櫃模式下資金流向明細圖的基準指數由加權指數（IX0001）改為櫃買指數（IX0043）
- Tab 切換後自動選取 changePercent 最高的上櫃產業，並重置 selectedSymbol / klineSymbol

## Capabilities

### New Capabilities

- `sector-flow-tpex`: 上櫃產業資金流向——上櫃市場 Tab UI、OTC sector-flow API 支援、資金流向圖基準指數切換

### Modified Capabilities

- `sector-flow-api`: 新增 `market` query parameter（`TSE` | `OTC`）至 sector-flow endpoint；OTC 模式下查 Market.OTC 並排除聚合指數
- `sector-money-flow`: 頁面新增市場切換 Tab，SectorFlowStateService 新增 activeMarket / benchmarkSymbol 狀態；SectorFlowChartsComponent 的基準指數改為由 state 動態決定

## Impact

- **API**: `apps/api/src/app/marketdata/dto/get-sector-flow.dto.ts`、`apps/api/src/app/marketdata/repositories/ticker.repository.ts`
- **前端 Service**: `apps/web/src/app/core/services/ticker.service.ts`
- **前端 State**: `apps/web/src/app/features/sector-flow/sector-flow-state.service.ts`
- **前端 Components**: `sector-flow.component.*`、`sector-flow-charts.component.ts`
- **無 breaking change**：`market` param 選填，預設 TSE，現有行為不變
