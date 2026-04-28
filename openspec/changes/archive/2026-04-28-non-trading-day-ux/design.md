## Context

`date-url-sync-and-fallback` 已實作：
- App 啟動時呼叫 `/trading-date?before=today`，自動 fallback 到最近交易日
- `dateReady` gate 讓頁面在日期確定前不渲染（`@if (dateReady())`）
- `ToolbarComponent` 的 `prevDay()` / `nextDay()` 會跳過週末

這個設計以「使用者永遠看到資料」為目標，但代價是**靜默替換日期**——用戶看到的日期不一定是他認為的日期，且無法感知「今天是否有資料」。

本次設計哲學轉變：**以誠實取代靜默**。系統不代替用戶決定日期，而是清楚呈現選中日期的資料狀態。

## Goals / Non-Goals

**Goals:**
- App 啟動立即渲染，`selectedDate = today`，無任何 fallback
- 全局 banner 在今日無交易資料時提示用戶，並提供「查看最近交易日」捷徑
- `prevDay()` / `nextDay()` 純粹 ±1 天，不跳過週末
- 各頁面空狀態訊息明確說明「此日期無交易資料」

**Non-Goals:**
- 不引入台股交易日 calendar（國定假日與「今日資料尚未更新」的區分留待未來）
- 不在 toolbar DatePicker 灰掉週末（不影響核心行為，可自行評估）
- 不修改後端任何 API

## Decisions

### D1：移除 `dateReady` gate，App 直接渲染

**決定：** `AppComponent` 不再等待任何非同步操作，template 移除 `@if (dateReady())`，`<router-outlet>` 始終渲染。`DashboardStateService` 移除 `dateReady` signal 與 `setDateReady()`。

**理由：** `dateReady` gate 存在是為了讓 fallback 後的日期在頁面渲染前就確定。移除 fallback 後，`selectedDate` 在啟動瞬間就是確定值（today），不需要 gate。

**拒絕的替代方案：**
- 保留 gate 但改為 banner 就緒後才顯示 → 增加不必要的初始延遲，banner 不是頁面的前置條件

---

### D2：Banner 以背景 API call 驅動，不阻塞渲染

**決定：** `AppComponent.ngOnInit()` 仍呼叫 `GET /trading-date?before=today`，但僅用於驅動 banner signal，不修改 `selectedDate`，不阻塞渲染。

```
App 啟動
  → 頁面立即渲染（selectedDate = today）
  → 背景: GET /trading-date → result.date < today → showBanner = true
```

**理由：**
- Banner 需要知道「今日有無資料」，目前唯一的輕量資料來源就是 `/trading-date`
- 背景呼叫不阻塞，banner 稍晚出現（< 100ms）使用者不會感知延遲
- 各頁面的 API 回 404/empty 也能間接知道無資料，但 banner 等各頁面資料才出現延遲過長

**拒絕的替代方案：**
- 讓各頁面往上回報無資料狀態 → banner 依賴頁面完成載入，出現時機不一致且複雜
- 完全移除 `/trading-date` 呼叫 → banner 無資料來源，無法顯示

---

### D3：Banner 放在 Toolbar 正下方，全局共用

**決定：** 在 `AppComponent` template 中，Toolbar 下方條件渲染一個橫幅：

```
今日無資料時：
  「今日行情尚未更新」  [查看最近交易日 →]

點擊按鈕後：
  呼叫 state.setDate(bannerLatestDate)  ← bannerLatestDate 從 /trading-date response 存起來
```

`showBanner` 當 `selectedDate` 改變（用戶切到有資料的日期）後自動關閉，或直接在 `setDate()` 中判斷。

**理由：** 全局橫幅比各頁面各自顯示更集中，使用者只需看一次即可理解狀態。

---

### D4：`prevDay()` / `nextDay()` 移除週末跳過邏輯

**決定：** `ToolbarComponent` 的 `prevDay()` / `nextDay()` 純粹 ±1 天，不做任何判斷。

**理由：** 與「誠實呈現」哲學一致。使用者選了哪天，頁面就呈現那天的狀態。週末選不到資料時，會顯示空狀態，與假日行為一致，不需特殊處理。

---

### D5：`app-init-date-fallback` spec 改為 CHANGED（移除既有 requirements）

**決定：** `app-init-date-fallback` spec 需要更新，移除「啟動時 fallback 到最近交易日」與「dateReady gate」的 requirements，改為「啟動時 selectedDate = today，立即渲染」。

## Risks / Trade-offs

- **首次體驗落差**：若用戶在早盤前開啟 App，看到今日頁面全為空狀態，可能感到困惑
  → Mitigation：Banner 清楚說明原因，並提供一鍵跳至最近交易日的捷徑

- **Banner 出現時機輕微延遲**：背景 API call 完成前，頁面與 banner 同時渲染但 banner 暫時不見
  → 可接受：延遲 < 100ms，且頁面本身也還在載入資料，用戶視覺焦點不在 banner 位置

- **`/trading-date` 呼叫保留**：雖然移除了 fallback，但這個 API call 仍存在
  → 這是刻意設計（驅動 banner），未來若 banner 有更好的資料來源可再移除

## Migration Plan

1. 移除 `DashboardStateService` 的 `dateReady` / `setDateReady()`
2. 修改 `AppComponent`：移除 `dateReady` gate，改為背景查詢驅動 banner signal
3. 修改 `ToolbarComponent`：移除 `prevDay()` / `nextDay()` 的週末條件
4. 新增 banner UI（`AppComponent` template 或獨立 component）
5. 更新 `app-init-date-fallback` spec

無後端變動，純前端改動，可隨時回滾。
