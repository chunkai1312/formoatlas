## MODIFIED Requirements

### Requirement: 大盤 K 線圖
系統 SHALL 在 Dashboard 的晴雨表 Hero Card 與今日籌碼速覽之間顯示加權指數 K 線圖（IX0001），採單一繪圖區，K 棒主圖佔上方主要空間，成交量 bar 疊於主圖下方（透過獨立隱藏 Y 軸控制高度佔比約 20%），卡片標題列 SHALL 提供 `[日K][週K]` 時間粒度切換按鈕與獨立 range 選擇器。日K 模式 range 選項為 `[1M][3M][6M][1Y]`，週K 模式 range 選項為 `[3M][6M][1Y][2Y]`。

#### Scenario: 成功載入 K 線資料
- **WHEN** Dashboard 載入且 `GET /marketdata/tickers?symbol=IX0001` 回傳成功
- **THEN** 系統 SHALL 顯示 candlestick K 棒與成交量 bar（疊於主圖下方），並顯示 MA5/MA10/MA20/MA60/MA120/MA240 均線

#### Scenario: MA info bar 常駐顯示
- **WHEN** K 線圖渲染完成
- **THEN** 圖表標題列下方 SHALL 顯示一排 MA info bar，列出 MA5～MA240 的當前值，每個 MA 值以對應顏色標示（MA5 琥珀黃、MA10 橙、MA20 淺紫、MA60 青藍、MA120 粉紅、MA240 黃綠；刻意避開 K 棒紅/綠以防撞色），預設顯示最後一根 K 棒的 MA 值

#### Scenario: MA info bar 隨 hover 更新
- **WHEN** 用戶 hover K 線圖任意 K 棒
- **THEN** MA info bar SHALL 即時更新為該 K 棒日期對應的 MA 值；滑鼠離開圖表時 SHALL 自動恢復為最後一根 K 棒的 MA 值

#### Scenario: MA 均線 warmup 正確性
- **WHEN** 用戶切換至較短 range（如 1M）
- **THEN** MA 均線 SHALL 不因 slice 資料不足而在可見範圍前段顯示空值缺口（使用完整快取資料計算後再 slice 對應段落顯示）

#### Scenario: 台灣紅漲綠跌色系
- **WHEN** K 線圖渲染資料
- **THEN** 陽線（收盤 ≥ 開盤）SHALL 顯示紅色（`#EF4444`），陰線（收 < 開）SHALL 顯示綠色（`#22C55E`）；成交量 bar 顏色 SHALL 與同日 K 棒顏色一致

#### Scenario: 與卡片 range 選擇器聯動（前端 slice）
- **WHEN** 用戶切換卡片的 range 按鈕
- **THEN** K 線圖 SHALL 立即更新至對應顯示期間，不發送 API 請求（從快取資料 slice）

#### Scenario: 日K 模式切換 range
- **WHEN** K 線圖處於日K模式，用戶點擊 `[1M]`、`[3M]`、`[6M]` 或 `[1Y]` 按鈕
- **THEN** 圖表 SHALL 即時更新顯示對應期間，不發送 API 請求

#### Scenario: 週K 模式切換 range
- **WHEN** K 線圖處於週K模式，用戶點擊 `[3M]`、`[6M]`、`[1Y]` 或 `[2Y]` 按鈕
- **THEN** 圖表 SHALL 即時更新顯示對應期間，不發送 API 請求

#### Scenario: 日K 切換至週K
- **WHEN** 用戶點擊 `[週K]` 按鈕
- **THEN** 系統 SHALL 以 endDate 為終點重新請求近 2Y 日K 資料，前端聚合為週K後依 localRange 顯示；若目前 localRange 為 `1M`（週K模式不支援），SHALL 自動 fallback 為 `3M`

#### Scenario: 週K 切換至日K
- **WHEN** 用戶點擊 `[日K]` 按鈕
- **THEN** 系統 SHALL 以 endDate 為終點重新請求近 1Y 日K 資料，依目前 localRange 顯示（若 localRange 為 `2Y`，SHALL fallback 為 `1Y`）

#### Scenario: 日期改變觸發重新 fetch
- **WHEN** 用戶透過 Toolbar 切換日期
- **THEN** 系統 SHALL 以新 endDate 重新請求對應視窗資料（日K 1Y，週K 2Y），並依目前 localRange 重新 slice 顯示

#### Scenario: 週K 聚合規則
- **WHEN** 前端對日K資料進行週K聚合
- **THEN** 每週 SHALL 以 ISO weekYear-weekNumber 分組，date 取該週最後一個交易日，open 取該週第一個交易日 openPrice，high 取 max(highPrice)，low 取 min(lowPrice)，close 取最後一個交易日 closePrice，tradeValue 取 sum(tradeValue)

#### Scenario: Tooltip 顯示
- **WHEN** 用戶 hover K 線圖任意 K 棒
- **THEN** Tooltip SHALL 顯示當日（或當週）開/高/低/收（與前日/週收盤比較顯示紅綠色）、漲跌點數、漲跌幅及成交金額（億元）

#### Scenario: 無資料空狀態
- **WHEN** API 回傳空陣列
- **THEN** 系統 SHALL 顯示「此期間無資料」空狀態佔位，不顯示空白圖表
