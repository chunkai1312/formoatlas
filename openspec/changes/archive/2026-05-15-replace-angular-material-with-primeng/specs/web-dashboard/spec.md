## MODIFIED Requirements

### Requirement: 晴雨表 Hero Card
系統 SHALL 顯示當日晴雨分析結果，採左右分欄佈局：左側顯示日期、大盤基本數據（加權指數、成交金額）及市場廣度比例條，右側顯示天氣圖示（大字）、以 PrimeNG 或應用程式自有 label/chip 類元件呈現的中文等級標籤及 AI 生成的盤勢摘要文字。Hero Card 使用統一的表面色背景（`var(--bg-surface)`），以左側 `4px` 等級色 accent border 區分盤勢，淺色與深色模式採相同視覺語言。

#### Scenario: 成功載入晴雨資料
- **WHEN** `GET /marketdata/barometer?date=<date>` 回傳成功
- **THEN** 系統 SHALL 於左側顯示日期、加權指數（含漲跌）及成交金額，右側顯示天氣圖示、中文等級標籤及 AI 摘要文字，Hero Card 左側 SHALL 有 `4px solid var(--color-<level>)` 的 accent border

#### Scenario: 晴雨等級 Accent Border 色彩映射
- **WHEN** 系統載入晴雨資料
- **THEN** Hero Card 左側 accent border 色彩 SHALL 依等級套用對應的 CSS token：STRONG_BULL=`var(--color-strong-bull)` / BULL=`var(--color-bull)` / NEUTRAL=`var(--color-neutral)` / BEAR=`var(--color-bear)` / STRONG_BEAR=`var(--color-strong-bear)`

#### Scenario: 晴雨等級標籤顯示
- **WHEN** 系統載入晴雨資料
- **THEN** 系統 SHALL 以 PrimeNG 或應用程式自有 label/chip 類元件顯示盤勢中文標籤（強多/偏多/中性/偏空/強空），標籤背景色 SHALL 為對應等級色彩的 15% opacity

#### Scenario: 市場廣度比例條顯示於成交金額下方
- **WHEN** 當日 `MarketStats` 包含廣度欄位（`advanceCount`、`declineCount` 有值）
- **THEN** 系統 SHALL 在成交金額 stat-block 下方顯示 `BreadthBarComponent`，呈現三色上漲/平盤/下跌比例條

#### Scenario: 廣度資料不存在時不顯示比例條
- **WHEN** 當日 `MarketStats` 的廣度欄位為 null
- **THEN** 系統 SHALL 不顯示廣度比例條，其餘 Hero Card 內容不受影響

#### Scenario: 假日或無資料日期
- **WHEN** `GET /marketdata/barometer` 回傳 HTTP 404
- **THEN** 系統 SHALL 在 Hero Card 顯示「此日期無市場資料」提示

#### Scenario: 顯示 Loading 狀態
- **WHEN** API 請求進行中
- **THEN** 系統 SHALL 在 Hero Card 區域顯示 PrimeNG 或應用程式自有 Loading 指示器

---

### Requirement: 趨勢圖表（雙 Y 軸）
系統 SHALL 顯示雙 Y 軸趨勢圖，左 Y 軸永遠為加權指數折線（`taiexPrice`），右 Y 軸為用戶透過 PrimeNG 或應用程式自有單選控制選取的籌碼指標，並以 PrimeNG 或應用程式自有 Tab 控制分為四個指標群。卡片標題列 SHALL 提供獨立的 `[1M][3M][6M][1Y]` range 選擇器。

#### Scenario: 加權指數永遠顯示
- **WHEN** 趨勢圖表載入
- **THEN** 加權指數折線 SHALL 永遠顯示於左 Y 軸，不可隱藏

#### Scenario: 副軸指標切換
- **WHEN** 用戶點選單選控制中的指標
- **THEN** 系統 SHALL 立即更新右 Y 軸資料為對應指標，無需重新發送 API 請求（前端切換）

#### Scenario: 與卡片 range 選擇器聯動
- **WHEN** 用戶點擊趨勢圖卡片的 `[1M]`、`[3M]`、`[6M]` 或 `[1Y]` 按鈕
- **THEN** 趨勢圖 SHALL 立即更新所有指標的顯示範圍至對應期間（前端 slice，不重新請求 API）

#### Scenario: 長條正負色彩（台灣慣例）
- **WHEN** 副軸為長條圖類指標
- **THEN** 正值長條 SHALL 顯示為紅色（#EF4444），負值顯示為綠色（#22C55E）

#### Scenario: 固定色彩指標
- **WHEN** 指標為融資餘額、融券餘額或多系列並列圖（如大額交易人近月＋遠月）
- **THEN** 長條 SHALL 使用固定指定顏色（藍色/紫色），不依正負套用紅綠色

#### Scenario: 參考線
- **WHEN** 副軸為 P/C Ratio 或散戶多空比
- **THEN** 圖表 SHALL 於 y=1 位置顯示水平虛線參考線

#### Scenario: Y 軸縮放
- **WHEN** 副軸指標設定 `scaleAxis: true`（如融資餘額、匯率等長期趨勢指標）
- **THEN** 右 Y 軸 SHALL 依資料範圍縮放，不強制從 0 開始

#### Scenario: 單一指標 Tab 隱藏指標選擇器
- **WHEN** Tab 內只有一個可選指標（如匯率走勢）
- **THEN** 系統 SHALL 隱藏指標選擇器，直接顯示該指標圖表

#### Scenario: Tooltip 同步
- **WHEN** 用戶 hover 圖表任意日期
- **THEN** 浮動 Tooltip SHALL 同時顯示當日加權指數數值及副軸指標數值，格式包含日期標頭

#### Scenario: 無資料空狀態
- **WHEN** `market-stats` 回傳空陣列
- **THEN** 圖表區域 SHALL 顯示空狀態佔位提示，不顯示空白圖表

---

### Requirement: 四大指標群 Tab
系統 SHALL 以 PrimeNG 或應用程式自有 Tab 控制組織四個指標群，每個 Tab 內提供對應的指標選項。

#### Scenario: 現貨籌碼 Tab 可選指標
- **WHEN** 用戶切換至「現貨籌碼」Tab
- **THEN** 指標選擇控制 SHALL 提供以下選項：外資買賣超（預設）、投信買賣超、自營商買賣超、融資餘額、融券餘額

#### Scenario: 期貨籌碼 Tab 可選指標
- **WHEN** 用戶切換至「期貨籌碼」Tab
- **THEN** 指標選擇控制 SHALL 提供以下選項：外資台指淨未平倉（預設）、大額交易人台指淨未平倉（近月＋遠月並列）、散戶小台淨未平倉、散戶小台多空比、散戶微台淨未平倉、散戶微台多空比

#### Scenario: 選擇權籌碼 Tab 可選指標
- **WHEN** 用戶切換至「選擇權籌碼」Tab
- **THEN** 指標選擇控制 SHALL 提供以下選項：外資台指選擇權淨未平倉（預設）、外資台指買權淨未平倉、外資台指賣權淨未平倉、台指選擇權 P/C Ratio

#### Scenario: 匯率走勢 Tab
- **WHEN** 用戶切換至「匯率走勢」Tab
- **THEN** 系統 SHALL 直接顯示 USD/TWD 折線圖，不顯示指標選擇控制
