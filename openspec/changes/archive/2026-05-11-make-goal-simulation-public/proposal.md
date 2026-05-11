## Why

目標模擬目前被設計成會員限定，但第一版功能只做即時計算：不保存設定、不保存結果、不讀取使用者個人資料，也沒有研究助理那類 LLM 成本。這使它更接近公開的目標試算器，而不是必須登入才合理的個人化功能。

將目標模擬公開可執行，可以讓新使用者先理解產品價值，並保留未來把保存、比較、匯出或自選股整合做成會員進階能力的空間。

## What Changes

- `POST /api/goal-simulation/run` 改為公開可呼叫，不再要求 JWT auth。
- `/goal-simulation` 頁面對未登入使用者也顯示表單與提交 action。
- 移除目標模擬頁面的登入 gate 文案與操作限制。
- 維持第一版不保存模擬設定或結果。
- 維持既有 request/response contract、單一股票買進持有、URL query params 初始化、圖表、交易紀錄與成本假設摘要。
- 保留風險揭露與歷史情境模擬限制，但不在本變更新增會員進階功能。

## Capabilities

### Modified Capabilities

- `goal-based-strategy-simulation`：將 API 與 UI 從會員限定調整為公開可執行，並保持不保存結果。

## Impact

- **後端**：移除 `GoalSimulationController` 的 `JwtAuthGuard`，更新 Swagger summary 與 controller 測試。
- **前端**：移除目標模擬頁面的 auth gate，讓表單永遠可見可提交，更新相關單元測試。
- **權限**：目標模擬不再作為會員限定功能；研究助理、watchlist、member backtesting 等既有會員限制不受影響。
- **資料庫**：無 schema 或資料遷移；仍不保存模擬結果。
- **營運風險**：公開端點增加匿名流量入口；本變更先沿用既有 DTO 限制，若後續流量上升再另開 change 補 rate limit 或 cache。
