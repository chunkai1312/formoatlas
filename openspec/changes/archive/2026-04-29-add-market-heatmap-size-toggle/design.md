## Context

首頁市場熱力圖目前由 `GET /marketdata/market-map` 提供階層化資料，前端 `MarketMapComponent` 使用 ECharts treemap 呈現。矩形大小固定使用 `marketCap`，顏色固定使用 `changePercent`。後端 `Ticker` document 已有 `tradeValue`，熱門個股等功能也已使用成交值排行，但 market-map response 目前沒有輸出 `tradeValue` 或產業成交金額加總。

現行 `marketCap` 計算為 `issuedShares * closePrice`，若缺少發行股數則 fallback 至 `tradeValue`。新增成交金額模式後，需要避免把「真市值」與「fallback size value」的語意混在一起。

## Goals / Non-Goals

**Goals:**

- 讓首頁市場熱力圖可在 `市值` 與 `成交金額` 兩種矩形大小維度之間切換。
- 保持顏色維度固定為漲跌幅，沿用台股紅漲綠跌色階。
- 讓切換在前端本地完成，不因切換大小維度而重新呼叫 market-map API。
- 擴充 market-map response，提供個股 `tradeValue` 與產業 `totalTradeValue`。
- 讓產業父節點的加權漲跌幅語意跟隨目前大小維度。
- 維持既有 `市值` 作為預設模式。

**Non-Goals:**

- 不新增獨立資金熱度頁，也不取代既有資金流向頁。
- 不改變市場切換行為；`TSE` / `OTC` 仍是市場範圍控制。
- 不新增 API query parameter 來要求特定大小模式。
- 不改變熱力圖顏色指標；顏色不切換為成交金額、成交量或法人資料。
- 不在本次重做 marketCap 的歷史資料或 Equity 資料來源。

## Decisions

### API 同時回傳市值與成交金額

`GET /marketdata/market-map` response 將在既有 `marketCap` / `totalMarketCap` 外，新增個股 `tradeValue` 與產業 `totalTradeValue`。

理由：市值與成交金額都來自同一日期、同一市場、同一批個股資料；一次回傳可讓前端切換模式時即時重算 treemap option，不需要增加 API 參數、快取分支或 loading 狀態。

曾考慮的替代方案：新增 `sizeBy=marketCap|tradeValue` query parameter。這會讓前端每次切換都要重新請求，並讓同一 endpoint 的 response 語意依參數改變；對目前資料量與互動需求沒有明顯好處。

### 大小維度是前端狀態，不是資料查詢狀態

首頁保留市場範圍 tab（上市 / 上櫃），新增獨立大小維度控制（市值 / 成交金額）。兩者是正交狀態：市場範圍決定 API data set，大小維度決定同一 data set 的視覺權重。

理由：`TSE` / `OTC` 是資料集合選擇；`市值` / `成交金額` 是視覺編碼選擇。分開呈現能避免使用者誤以為四個選項彼此互斥。

曾考慮的替代方案：將四種組合做成單一 tab group。這會混合兩種語意，也會讓後續若加入更多視覺維度時擴充困難。

### 產業父節點顏色權重跟隨大小維度

個股顏色仍直接使用個股 `changePercent`。產業父節點的 `weightedChange` 在市值模式使用 `marketCap` 加權，在成交金額模式使用 `tradeValue` 加權。

理由：父節點面積與父節點顏色都應反映同一個閱讀鏡頭。成交金額模式代表「今日資金在哪裡」，此時大量成交個股應對產業顏色有較大影響。

曾考慮的替代方案：父節點顏色永遠使用市值加權。這能維持結構穩定，但在成交金額模式下會出現面積代表資金、顏色代表權值結構的語意錯位。

### 保留市值作為預設模式

首頁載入時仍預設 `市值` 模式，文案顯示目前矩形大小與顏色含義。

理由：市值模式較穩定，適合作為首頁第一眼的市場地形；成交金額模式波動較高，適合作為使用者主動切換後觀察資金熱區。

曾考慮的替代方案：預設成交金額模式。這能更突出當日熱度，但會改變現有首頁心智，也可能讓大型權值股在首頁第一眼的市場影響被低估。

### Tooltip 維持精簡 OHLCV

Tooltip 應維持既有 OHLCV、漲跌幅與成交量資訊，不顯示大小指標、市值或成交金額。

理由：熱力圖已在區塊文案與 segmented control 中說明目前矩形大小維度；tooltip 若再列出大小指標、市值與成交金額會變得過重，降低使用者快速掃描 OHLCV 的效率。

曾考慮的替代方案：Tooltip 同時顯示市值與成交金額。這能核對面積背後的數字，但實際顯示太擁擠，且與使用者快速看價量資訊的目的衝突。

## Risks / Trade-offs

- 成交金額模式圖形跳動較大 -> 保留市值為預設，並用明確 label 說明「矩形大小」目前代表的指標。
- API response 變大 -> 只增加兩個 numeric 欄位，對現有資料量與首頁用途影響可控。
- `marketCap` fallback 至 `tradeValue` 可能造成語意混淆 -> 實作時應保留 `marketCap` 欄位語意，並在 size 計算中明確處理缺值 fallback，不把 fallback 後的值當成真市值展示。
- 成交金額為 0 或缺值會造成 treemap 不可見 -> 前端 size 計算需以非負數處理，並在整體無可用 size 時顯示既有空狀態或退回可用資料。
- 控制列在小螢幕可能擁擠 -> 將市場 tab 與大小 toggle 視為兩組控制，允許換行並保持 label 簡短。
