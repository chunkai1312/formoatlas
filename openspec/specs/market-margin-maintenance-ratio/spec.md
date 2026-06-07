## Purpose
定義 TWSE 上市市場全部信用交易標的的大盤融資維持率計算、儲存、盤後更新與 API 回傳行為，確保前端可在大盤趨勢圖中呈現融資維持率。

## Requirements
### Requirement: 儲存 TWSE 大盤融資維持率
系統 SHALL 於 `MarketStats` 儲存 `marginMaintenanceRatio`，表示 TWSE 上市市場全部信用交易標的的融資維持率。`marginMaintenanceRatio` SHALL 以 decimal ratio 儲存並四捨五入至小數點後四位，例如 `1.9898` 代表 `198.98%`。

#### Scenario: 成功計算融資維持率
- **WHEN** 指定日期存在 `MarketStats.marginBalance`，且同日 TWSE `Ticker` 資料包含有效 `closePrice` 與 `marginTrading.marginBalance`
- **THEN** 系統 SHALL 以 `sum(marginTrading.marginBalance * closePrice * 1000) / (MarketStats.marginBalance * 1000)` 計算 `marginMaintenanceRatio`
- **AND** 系統 SHALL 將計算結果寫入對應日期的 `MarketStats` 文件

#### Scenario: 缺少大盤融資金額餘額
- **WHEN** 指定日期沒有 `MarketStats.marginBalance` 或其值小於等於 0
- **THEN** 系統 SHALL 不寫入 `marginMaintenanceRatio`
- **AND** 系統 SHALL 記錄 warn 日誌，指出融資維持率缺少分母資料

#### Scenario: 部分個別標的缺少收盤價
- **WHEN** 指定日期部分 TWSE 信用交易標的缺少有效 `closePrice`
- **THEN** 系統 SHALL 排除這些標的並使用其餘有效標的計算 `marginMaintenanceRatio`
- **AND** 系統 SHALL 不因部分標的缺資料導致整體計算失敗

### Requirement: 融資維持率納入盤後更新流程
系統 SHALL 在 TWSE 大盤信用交易資料與 TWSE 個別標的融資融券資料更新後，執行融資維持率計算。

#### Scenario: Cron job 觸發
- **WHEN** 融資維持率 Cron 排程於每日晚間信用交易資料發布時段觸發
- **THEN** 系統 SHALL 呼叫融資維持率更新方法並以當天日期為參數

#### Scenario: App 初始化補資料
- **WHEN** `MARKETDATA_INIT_ENABLED=true` 且系統依日期補抓市場資料與 ticker 資料
- **THEN** 系統 SHALL 在同一日期 `tickerService.updateTickers()` 完成後再計算 `marginMaintenanceRatio`

### Requirement: Market Stats API 回傳融資維持率
系統 SHALL 透過 `GET /marketdata/market-stats` 回傳每日 `marginMaintenanceRatio`，供前端趨勢圖使用。

#### Scenario: 查詢包含融資維持率的日期區間
- **WHEN** 用戶查詢包含已計算融資維持率的日期區間
- **THEN** API 回傳的對應日期資料 SHALL 包含 `marginMaintenanceRatio`

#### Scenario: 查詢尚未計算融資維持率的歷史日期
- **WHEN** 用戶查詢尚未寫入 `marginMaintenanceRatio` 的日期
- **THEN** API SHALL 保持既有市場統計回傳格式可用
- **AND** 前端 SHALL 能將缺少的 `marginMaintenanceRatio` 視為無資料
