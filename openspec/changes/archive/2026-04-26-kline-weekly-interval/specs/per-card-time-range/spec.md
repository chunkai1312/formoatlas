## MODIFIED Requirements

### Requirement: 各圖卡片內建時間區間選擇器
K 線圖卡片與籌碼趨勢卡片 SHALL 各自在卡片標題列提供時間區間按鈕，預設選取 `3M`，選取狀態 SHALL 以 active 樣式明確標示。兩張圖的 range 選擇互不影響。K 線圖卡片的 range 選項 SHALL 根據目前時間粒度（日K/週K）動態顯示：日K 模式為 `[1M][3M][6M][1Y]`，週K 模式為 `[3M][6M][1Y][2Y]`。籌碼趨勢卡片維持 `[1M][3M][6M][1Y]`。

#### Scenario: 預設選取 3M
- **WHEN** 頁面首次載入
- **THEN** K 線圖卡片與籌碼趨勢卡片的 range 選擇器 SHALL 各自預設顯示 `3M` 為選取狀態

#### Scenario: 切換 range 為前端即時 slice
- **WHEN** 用戶點擊 K 線圖卡片或趨勢卡片的任一 range 按鈕
- **THEN** 系統 SHALL 立即更新圖表顯示範圍至對應期間，不發送任何 API 請求

#### Scenario: 兩圖 range 獨立
- **WHEN** 用戶將 K 線圖 range 切換為 `6M`
- **THEN** 籌碼趨勢圖的 range 選取狀態 SHALL 保持不變

#### Scenario: range 不持久化
- **WHEN** 用戶重新載入頁面
- **THEN** 兩張圖的 range SHALL 恢復為預設值 `3M`

#### Scenario: 週K 模式下 range 選項動態切換
- **WHEN** 用戶將 K 線圖切換至週K模式
- **THEN** K 線圖卡片的 range 按鈕 SHALL 變更為 `[3M][6M][1Y][2Y]`，且若原 localRange 為 `1M` SHALL 自動 fallback 為 `3M`

#### Scenario: 日K 模式下 range 選項恢復
- **WHEN** 用戶將 K 線圖切換回日K模式
- **THEN** K 線圖卡片的 range 按鈕 SHALL 恢復為 `[1M][3M][6M][1Y]`，且若原 localRange 為 `2Y` SHALL 自動 fallback 為 `1Y`

---

### Requirement: 資料抓取策略（依時間粒度決定 fetch 視窗）
K 線圖 SHALL 根據目前時間粒度動態決定 fetch 視窗：日K 模式以 `endDate` 為終點抓取近 1Y 資料，週K 模式抓取近 2Y 資料。籌碼趨勢圖維持 1Y 視窗。range 切換是純前端 slice，不發 API 請求；時間粒度切換或日期改變時才重新 fetch。

#### Scenario: 日期改變觸發重抓
- **WHEN** 用戶切換 Toolbar 日期
- **THEN** 系統 SHALL 以新 endDate 重新請求資料（日K 1Y，週K 2Y），並依目前 localRange 重新 slice 顯示

#### Scenario: range 切換不觸發 API
- **WHEN** 用戶切換卡片 range 按鈕
- **THEN** 系統 SHALL 不發送任何 API 請求，直接從已快取的資料 slice 對應期間顯示

#### Scenario: 時間粒度切換觸發重抓
- **WHEN** 用戶切換 K 線圖時間粒度（日K ↔ 週K）
- **THEN** 系統 SHALL 以新視窗大小重新請求資料（日K → 1Y，週K → 2Y），切換前的快取資料丟棄

---

### Requirement: endDate 跟隨全域日期選擇
兩張圖的時間軸右端點（endDate）SHALL 永遠等於 Toolbar 的目前選取日期（`selectedDate`），不受各卡片 range 選擇或時間粒度切換影響。

#### Scenario: 日期改變時圖表右端點同步更新
- **WHEN** 用戶透過 Toolbar 切換日期
- **THEN** K 線圖與趨勢圖的 endDate SHALL 立即更新為新選取日期，並依各自 localRange 與時間粒度計算新的 fetch 視窗重新抓取資料

#### Scenario: 歷史回顧模式
- **WHEN** 用戶將 Toolbar 日期設為歷史日期（如 `2025-08-01`）
- **THEN** 兩張圖時間軸的右端點 SHALL 對齊 `2025-08-01`，各自的 range 按鈕決定往前顯示多少期間
