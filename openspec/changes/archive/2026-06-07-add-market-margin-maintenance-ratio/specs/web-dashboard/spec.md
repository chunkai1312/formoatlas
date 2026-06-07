## ADDED Requirements

### Requirement: 融資維持率趨勢圖
系統 SHALL 在大盤總覽的趨勢圖表中提供融資維持率趨勢圖，使用 `MarketStats.marginMaintenanceRatio` 作為副軸資料，並將 decimal ratio 顯示為百分比。

#### Scenario: 顯示融資維持率趨勢
- **WHEN** 用戶在「現貨籌碼」Tab 選取「融資維持率」
- **THEN** 趨勢圖 SHALL 於左 Y 軸顯示加權指數折線
- **AND** 趨勢圖 SHALL 於右 Y 軸顯示 `marginMaintenanceRatio` 轉換後的百分比折線

#### Scenario: 融資維持率資料缺漏
- **WHEN** 部分日期沒有 `marginMaintenanceRatio`
- **THEN** 趨勢圖 SHALL 將缺漏日期視為空值
- **AND** 趨勢圖 SHALL 不因部分缺漏資料顯示空白或造成頁面錯誤

## MODIFIED Requirements

### Requirement: 四大指標群 Tab
系統 SHALL 以 PrimeNG 或應用程式自有 Tab 控制組織四個指標群，每個 Tab 內提供對應的指標選項。

#### Scenario: 現貨籌碼 Tab 可選指標
- **WHEN** 用戶切換至「現貨籌碼」Tab
- **THEN** 指標選擇控制 SHALL 提供以下選項：外資買賣超（預設）、投信買賣超、自營商買賣超、融資餘額、融券餘額、融資維持率

#### Scenario: 期貨籌碼 Tab 可選指標
- **WHEN** 用戶切換至「期貨籌碼」Tab
- **THEN** 指標選擇控制 SHALL 提供以下選項：外資台指淨未平倉（預設）、大額交易人台指淨未平倉（近月＋遠月並列）、散戶小台淨未平倉、散戶小台多空比、散戶微台淨未平倉、散戶微台多空比

#### Scenario: 選擇權籌碼 Tab 可選指標
- **WHEN** 用戶切換至「選擇權籌碼」Tab
- **THEN** 指標選擇控制 SHALL 提供以下選項：外資台指選擇權淨未平倉（預設）、外資台指買權淨未平倉、外資台指賣權淨未平倉、台指選擇權 P/C Ratio

#### Scenario: 匯率走勢 Tab
- **WHEN** 用戶切換至「匯率走勢」Tab
- **THEN** 系統 SHALL 直接顯示 USD/TWD 折線圖，不顯示指標選擇控制
