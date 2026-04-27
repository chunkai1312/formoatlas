## Context

目前 `DashboardStateService` 以 Angular Signal 維護選中日期，toolbar 切換日期時呼叫 `setDate()`，各頁面透過 `toObservable(selectedDate)` 反應式載入 API 資料。然而：
- 日期狀態僅存在 memory，頁面重新整理或分享連結無法保存選中日期
- `DashboardComponent` 用了一個「首次載入後 setDate」的副作用來找最近交易日，與 `HomeComponent` 行為不一致
- 假日或停市日被選中時，各頁面各自顯示錯誤，沒有統一 fallback

本次變更跨越 API（NestJS）與前端（Angular），涉及新 endpoint、Service 修改、與啟動流程重構。

## Goals / Non-Goals

**Goals:**
- App 啟動時，自動定位到最近交易日（含 URL 給的日期作為起點）
- `setDate()` 同步更新 URL `?date=`，所有頁面共享
- 使用者切換到假日/停市日時保持現有行為（各頁面自行顯示無資料），不需每次驗證
- 分享連結 `?date=2026-04-25` 可直接落地到正確日期

**Non-Goals:**
- toolbar 切換日期時不做 fallback 驗證（會多一個 roundtrip，UX 負擔大於收益）
- 不支援多個 date 維度（只有一個全局日期）
- 不需 SSR/pre-render 支援

## Decisions

### D1：新增 `GET /trading-date?before=<date>` endpoint

**決定：** 在 `marketdata.controller.ts` 新增此 endpoint，直接查 `market-stats` collection 的最新日期。

**理由：**
- `market-stats` 是最可靠的交易日判斷依據（所有交易日都有至少部分欄位），且已有 repository
- 比 range query 輕量（`findOne + sort`，O(log n) index scan vs. N 筆資料傳輸）
- 職責明確，可在未來其他情境重用

**拒絕的替代方案：**
- 沿用 `GET /market-stats?startDate=today-30d&endDate=today` 取最後一筆：回傳資料量大，且混用「查資料」與「找日期」兩個目的

---

### D2：`DashboardStateService` 負責 URL 同步

**決定：** `setDate()` 內加入 `router.navigate([], { queryParams: { date }, queryParamsHandling: 'merge', replaceUrl: true })`。

**理由：**
- 所有呼叫 `setDate()` 的地方（toolbar、AppComponent init）都自動獲得 URL 同步，不需各自處理
- `replaceUrl: true` 避免每次切換日期都產生 browser history entry

**拒絕的替代方案：**
- 各 Component 各自同步 URL：重複邏輯，容易不一致
- 用 Angular Router 的 `RouterState` 作為 signal 來源：URL 驅動 state 的方向反過來，使所有日期變更都必須走 router，複雜度更高

---

### D3：App 啟動由 `AppComponent` 統一初始化，`DashboardComponent` 移除副作用

**決定：** `AppComponent.ngOnInit()` 讀取 `?date=`，呼叫 `/trading-date` 取得最近交易日，再呼叫 `state.setDate()`。`DashboardComponent` 的 `dateInitialized` 邏輯刪除。

**理由：**
- `AppComponent` 是所有 route 共用的 shell，放在這裡確保任何頁面首次載入都觸發
- `DashboardComponent` 的副作用只在 `market-overview` route 生效，其他頁面進入時都沒有 fallback

**注意：** `AppComponent` 初始化完成前，`selectedDate` 仍是今日（`DashboardStateService` 的初始值）。為避免各頁面在 init 完成前就發出 API request，需在 `AppComponent` 確認 init 完成後才 bootstrap 頁面（或讓各頁面 skip 初始 emit 直到 date 確定）。

→ **實作方式：** 在 `DashboardStateService` 加入 `dateReady: Signal<boolean>`，初始為 `false`，init 完成後設為 `true`。各頁面的 `toObservable(selectedDate)` 改為 `toObservable(selectedDate).pipe(skipUntil(toObservable(dateReady).pipe(filter(v => v))))`，或使用 `combineLatest`。

**更簡單的替代實作：** `AppComponent` 直接在 template 用 `@if (dateReady())` 包住 `<router-outlet>`，init 完成前不渲染任何頁面。

→ 選擇後者：更簡單、不需修改所有頁面。

## Risks / Trade-offs

- **首次載入多一個 HTTP roundtrip** → `/trading-date` 極輕量（index scan），預期 < 20ms，可接受
- **`AppComponent` 延遲渲染** → `@if (dateReady())` 包住 router-outlet，用戶會看到短暫空白。可用 loading spinner 緩解
- **`?date=` 被竄改為非法字串** → `DateTime.fromISO()` 解析失敗時 fallback 為 today，不會崩潰

## Migration Plan

1. 部署 API 新 endpoint（可先上，前端未使用時無副作用）
2. 部署前端變更（含 `AppComponent` init + `DashboardStateService` URL 同步）
3. 不需 rollback 計劃：無 DB schema 變更，API endpoint 純新增
