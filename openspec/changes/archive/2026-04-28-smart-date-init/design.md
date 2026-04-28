## Context

目前 App 啟動時，`AppComponent.ngOnInit()` 設定 `selectedDate` 後立即渲染頁面，所有子元件同時發出 API 請求。`/trading-date` 被用來驅動一個「今日尚未更新」的 banner，但 banner 已決定移除。

問題在於，當今天沒有市場資料時（週末、假日、盤前），所有 API 都會回傳 304（找到舊資料），前端再過濾顯示空狀態——這是一次不必要的 DB 查詢與網路往返。

`/trading-date` 的後端語義是「最近一筆有 market-stats 資料的日期」，天然包含「今天資料尚未入庫」的情境。

## Goals / Non-Goals

**Goals:**
- 無 `?date=` 時，先查 `/trading-date` 取得有效日期再載入資料，避免無謂請求
- 有 `?date=` 時（包含手動選日期），維持直接載入、誠實呈現空狀態的行為
- `/trading-date` 等待期間顯示全頁 loading skeleton，不渲染空卡片
- `/trading-date` 回 null 時，fallback 至今日，直接顯示空狀態

**Non-Goals:**
- 修改後端 API 行為
- 變更手動選日期的邏輯（Toolbar 的 prevDay/nextDay/datepicker 不變）
- 實作時區轉換

## Decisions

### Decision 1：以 URL 有無 `?date=` 作為 gate 觸發條件

**選擇**：App 啟動時，若 URL 有 `?date=` 參數，直接設定 `selectedDate` 並立即觸發資料載入（不需 gate）；若無 `?date=`，則先查 `/trading-date` 再觸發。

**理由**：`?date=` 代表用戶的明確意圖，應誠實呈現。無 `?date=` 代表「給我最新的」，需要一次查詢確認有效日期。這個區分語義清晰，不會破壞歷史連結的行為。

**替代方案**：每次都先查 `/trading-date`（不論有無 `?date=`）→ 增加不必要的 waterfall，且對有 `?date=` 的情境沒有幫助。

---

### Decision 2：重新引入 `dateReady` gate signal（輕量版）

**選擇**：在 `DashboardStateService` 加回 `readonly dateReady = signal<boolean>(false)`，`AppComponent` 在 gate 通過後呼叫 `setDateReady()`；App template 以 `@if (dateReady())` 控制 `<router-outlet>` 是否渲染。

**理由**：這與上一次移除的 `dateReady` 語義不同——舊的 `dateReady` 在所有情境下都 gate，且會強制修改日期；新的 `dateReady` 只在「無 `?date=`」時 delay，有 `?date=` 時立即設為 true，頁面立刻渲染。

**替代方案**：用 `selectedDate` 的初始值為 `null` 表示「尚未就緒」→ 影響所有依賴 `selectedDate` 的邏輯，風險較高。

---

### Decision 3：Banner 移除，不替換

**選擇**：完全移除 banner 相關程式碼（`bannerLatestDate` signal、template、scss）。

**理由**：Gate 機制取代了 banner 的功能——用戶在無 `?date=` 時直接看到最新有效日期，不需要提示。

## Risks / Trade-offs

- **Gate 增加首次載入 waterfall**（無 `?date=`）→ `/trading-date` 通常極快（single index scan），實際延遲可感知程度低；接受此 trade-off 換取消除無謂請求
- **`?date=` 非交易日顯示空白**可能讓初次使用者困惑 → 各卡片已有「此日期無資料」提示文字，可接受
- **`/trading-date` 回 null**（DB 無任何資料）→ fallback 至 `selectedDate = today`，`dateReady = true`，各卡片顯示空狀態

## Migration Plan

1. 修改 `DashboardStateService`：加回輕量版 `dateReady` signal
2. 修改 `AppComponent`：移除 banner，加入 gate 邏輯
3. 修改 `app.html`：加回 `@if (dateReady())` gate，移除 banner template
4. 修改 `app.scss`：移除 banner 樣式
5. 更新 `app.spec.ts`：新增 gate 行為測試

Rollback：git revert 即可，無資料遷移。
