## Context

目標模擬第一版已實作為即時計算功能：使用 request 中的目標、投入、日期區間與單一股票代號，讀取市場 OHLC，產生買進持有歷史情境結果。此功能不讀取目前使用者、不保存設定或結果，也不依賴會員資料。

原本的會員限制來自 `goal-based-strategy-simulation` 初始實作時沿用 member backtesting 的產品邊界。但目標模擬更接近公開試算器，適合讓新使用者直接體驗 FormoAtlas 的資料與模擬能力。

## Decision

將 `POST /api/goal-simulation/run` 與 `/goal-simulation` UI 改為公開可執行。

本變更只移除執行前的登入限制：

- API 不再使用 `JwtAuthGuard`
- UI 不再顯示未登入 auth gate
- 未登入使用者可看到表單、提交 request、查看結果
- 仍不保存模擬設定或結果
- 不新增會員進階功能

## Rationale

目標模擬目前沒有 user-specific 行為：

- request 已包含所有計算所需參數
- service 不需要 current user
- response 不包含個人資料
- 結果沒有 persistence
- 沒有 LLM 或第三方付費推論成本

因此用登入牆保護整個功能，產品成本高於目前技術與營運收益。公開可用能降低新使用者理解門檻，也讓 URL query params 的分享/帶入表單能力更自然。

## Scope Boundary

本變更不處理以下事項：

- 保存模擬設定或結果
- 匯出報告
- 多情境比較
- 從 watchlist 帶入標的
- 會員專屬模板
- 匿名 rate limit 或快取

若公開端點後流量或濫用風險上升，應另開 change 設計 API rate limit、cache 或更細的計算限制。

## Implementation Notes

後端只需移除 controller-level guard，保留 DTO validation 與 service 行為。公開化不應改變 request/response contract。

前端應讓表單常駐，並移除 `AuthService` / `LoginRequiredService` 在目標模擬元件中的依賴。其他功能的會員 gate，例如 research assistant、watchlist、member backtesting，不受本變更影響。

測試應改為驗證未登入狀態也可看到 submit action 並呼叫 goal simulation service，而不是驗證登入提示。
