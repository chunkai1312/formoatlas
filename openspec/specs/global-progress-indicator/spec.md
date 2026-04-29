## Purpose

定義 web app 的全域 progress bar 行為，確保使用者在路由切換、lazy route loading 與資料請求期間能看到一致、低干擾且不閃爍的 loading feedback。

## Requirements

### Requirement: 全域 Progress Bar 顯示位置
系統 SHALL 在 web app 的 TopBar 上方顯示全域 progress bar，作為路由切換與資料請求期間的低干擾 loading feedback。Progress bar SHALL 使用專用全域 progress color token，不得直接綁定市場漲跌語意色。

#### Scenario: 顯示於導覽列上方
- **WHEN** 全域 progress bar 進入可見狀態
- **THEN** 系統 MUST 將 progress bar 顯示在 viewport 最上方且位於 TopBar 上緣

#### Scenario: 不改變頁面排版
- **WHEN** 全域 progress bar 顯示或隱藏
- **THEN** 系統 MUST NOT 推擠 TopBar、頁面內容或 footer 的 layout

#### Scenario: 使用專用顏色 token
- **WHEN** 全域 progress bar 顯示
- **THEN** 系統 MUST 使用專用全域 progress color token 呈現 progress bar 顏色

### Requirement: Router Navigation Progress
系統 SHALL 追蹤 Angular router navigation 與 lazy route loading，讓使用者在切換頁面期間看到全域 progress feedback。

#### Scenario: 路由切換開始
- **WHEN** Angular router 發出 navigation start event
- **THEN** 系統 MUST 啟動一個 router progress activity

#### Scenario: 路由切換完成
- **WHEN** Angular router navigation end event 發生
- **THEN** 系統 MUST 結束對應的 router progress activity

#### Scenario: 路由切換取消或錯誤
- **WHEN** Angular router navigation cancel 或 navigation error event 發生
- **THEN** 系統 MUST 結束對應的 router progress activity

#### Scenario: Lazy route loading
- **WHEN** lazy route loading start event 發生
- **THEN** 系統 MUST 讓全域 progress bar 維持 active，直到 lazy route loading end event 發生

### Requirement: HTTP Request Progress
系統 SHALL 透過前端 HTTP interceptor 追蹤一般 API request，且不要求每個 feature service 手動控制全域 progress。

#### Scenario: API request 開始
- **WHEN** 被追蹤的 HTTP API request 開始
- **THEN** 系統 MUST 啟動一個 HTTP progress activity

#### Scenario: API request 完成
- **WHEN** 被追蹤的 HTTP API request 成功完成
- **THEN** 系統 MUST 結束對應的 HTTP progress activity

#### Scenario: API request 錯誤或取消
- **WHEN** 被追蹤的 HTTP API request 發生錯誤或被取消
- **THEN** 系統 MUST 結束對應的 HTTP progress activity

#### Scenario: 並行 request
- **WHEN** 多個被追蹤的 HTTP API request 同時進行
- **THEN** 系統 MUST 讓全域 progress bar 維持 active，直到所有被追蹤的 request 都完成、錯誤或取消

### Requirement: Progress Timing And Animation
系統 SHALL 使用延遲顯示、pseudo progress 與完成淡出來避免短請求閃爍，同時提供清楚的完成感。

#### Scenario: 短活動不顯示
- **WHEN** 所有 progress activity 在顯示延遲門檻前完成
- **THEN** 系統 MUST NOT 顯示全域 progress bar

#### Scenario: 活動期間推進
- **WHEN** 至少一個 progress activity 仍在進行且 progress bar 已顯示
- **THEN** 系統 MUST 以 pseudo progress 呈現進度推進，但 MUST NOT 顯示百分比文字

#### Scenario: 所有活動完成
- **WHEN** 所有 progress activity 都已完成且 progress bar 已顯示
- **THEN** 系統 MUST 將 progress bar 推進到 100%，短暫停留後淡出

#### Scenario: 淡出期間有新活動
- **WHEN** progress bar 正在淡出且新的 progress activity 開始
- **THEN** 系統 MUST 取消淡出並讓 progress bar 回到 active 狀態

### Requirement: Excluded Requests
系統 SHALL 支援排除不適合納入全域 progress 的 request，避免長時間連線或背景工作讓 progress bar 卡住。

#### Scenario: Agent streaming request
- **WHEN** 前端發出 agent streaming request
- **THEN** 系統 MUST NOT 將該 request 納入全域 progress tracking

#### Scenario: 明確標記略過的 request
- **WHEN** 前端 request 被標記為略過全域 progress tracking
- **THEN** 系統 MUST NOT 因該 request 啟動或維持全域 progress bar

### Requirement: App Shell Integration
系統 SHALL 將全域 progress bar 整合在 app shell / core 層，讓既有頁面可以保留自己的局部 loading state。

#### Scenario: Feature page 無需手動接線
- **WHEN** 既有 feature page 透過 core service 發出一般 HTTP API request
- **THEN** 系統 MUST 透過共用 interceptor 自動處理全域 progress tracking

#### Scenario: 局部 loading state 保留
- **WHEN** feature page 已有 skeleton、empty state 或局部 loading indicator
- **THEN** 系統 MUST 允許該局部 loading state 與全域 progress bar 並存
