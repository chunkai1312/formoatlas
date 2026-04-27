## Context

`/sector-flow` 目前的第一段「產業資金流向」直接呈現完整排行表。表格適合細看欄位，但不適合作為第一眼的成交比重輪廓。使用者若想回答「今天資金集中在哪些產業」或「集中度是否偏高」，需要從多欄表格中自行比較 `tradeWeight`。

既有 API 已提供足夠資料：

- `tradeWeight`：當日成交比重
- `tradeWeightPrev`：昨日成交比重
- `tradeWeightChange`：成交比重變化
- `tradeValue`：成交金額
- `symbol` / `name`：產業代碼與名稱

因此本變更應以 frontend visualization 為主，不需要新增後端資料源。

## Decision

### 使用 compact horizontal bar list

新增圖表採用「橫向長條列表」而不是完整座標軸 bar chart。

理由：

- 產業中文名稱較長，直式 bar chart 需要旋轉或直排 X 軸標籤，掃讀成本高。
- 目前頁面已經有完整表格，新增圖應是摘要層，不應再變成另一張大型表格或重型圖表。
- 橫向列能直接放入產業名稱、成交比重與比重差，在 desktop/mobile 都較穩定。

概念：

```text
成交比重分佈
半導體          ██████████████████ 39.49%  +1.36%
電子零組件      ██████████         21.31%  +2.47%
電腦及週邊設備  ████                7.77%  +0.83%
```

### 顯示前 10 筆成交比重

分佈圖依 `tradeWeight` 降冪顯示前 10 筆產業。完整排行仍由下方表格負責。

理由：Top 10 足以呈現主要資金集中區域，也避免圖表高度壓縮下方內容。若 OTC 產業數較少，顯示可用資料即可。

### Hover 提示互動，點擊列同步選取產業

點擊分佈圖中的產業列時，同步更新：

- `selectedSymbol`
- `selectedName`
- `klineSymbol`

理由：使用者點擊摘要圖上的產業，通常期待下方「資金流向明細」與「產業類股走勢」一起切到該產業。這讓摘要圖不只是靜態圖，也成為進入明細的自然導航。

分佈圖不顯示持久 active row，避免把摘要圖表現成重型選取控制。互動提示以 hover/focus 樣式呈現；下方 section 標題維持穩定，不附加目前產業名稱。

這個互動不改變排行表的純展示定位；表格仍不負責列點選。

### 色彩語意

主要 bar 使用中性或 accent 色表達成交比重大小，避免把成交比重誤讀為漲跌。`tradeWeightChange` 的正負可使用既有台股慣例色：

- 比重增加：紅色 `var(--color-positive)`
- 比重下降：綠色 `var(--color-negative)`
- 無變化：次要文字色

### 版面位置

分佈圖應放在「產業資金流向」section 內、排行表上方，與表格形成同一個資訊群：

```text
產業資金流向
├─ 成交比重分佈 Top 10
└─ 排行表
```

## Alternatives Considered

### Full vertical bar chart

優點是接近使用者提供的參考截圖，視覺上像傳統券商資料頁。

未採用原因：中文產業名稱過多時 X 軸可讀性差，且圖表高度較大，容易把頁面第一段變成重型 chart dashboard。

### Treemap

Treemap 很適合呈現集中度，但對精準比較百分比不如 bar list，且目前產品尚未使用 treemap 這種視覺語言。

### 只調整表格預設排序

表格目前可排序，但預設排序是 `changePercent`。即使改成 `tradeWeight`，使用者仍需要逐列比較，無法快速看出比例差距。

## Risks / Trade-offs

- Top 10 摘要可能忽略尾端產業 -> 下方表格仍保留完整資料。
- 點擊分佈圖同步 K 線可能改變目前「Section 2 與 Section 3 可分離選取」的行為 -> 僅摘要圖點擊時同步，Section 3 下拉仍可獨立切換。
- 若使用 eCharts 會增加元件重量 -> 建議先用 HTML/CSS bar list 實作，資料量少且互動簡單。
