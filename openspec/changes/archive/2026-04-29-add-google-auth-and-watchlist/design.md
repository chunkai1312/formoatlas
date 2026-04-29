## Context

FormoAtlas 目前是一個無狀態的市場資料儀表板，所有功能對訪客完全公開，API 無任何 auth guard。隨著研究助理（Agent）已上線，以及 Watch List 即將推出，需要一個穩固的使用者身份系統來保存個人資料並支援未來的個人化功能擴展。

現有技術棧：NestJS 11 + MongoDB（Mongoose）+ Angular 21（Signals）。無任何現有 auth 基礎設施。

## Goals / Non-Goals

**Goals:**
- 透過 Google OAuth 2.0 提供低 friction 登入
- JWT httpOnly Cookie session（無 localStorage token 洩漏風險）
- 研究助理和 Watch List 受 auth gate 保護，訪客看到登入提示
- 一般市場資料功能維持完全公開
- Watch List 以使用者 MongoDB document 嵌入方式儲存

**Non-Goals:**
- 帳號密碼登入
- 多 OAuth provider（本次只做 Google）
- 對話歷史持久化（未來 change）
- Watch List 告警通知（未來 change）
- 使用者管理後台

## Decisions

### Decision 1：JWT httpOnly Cookie，非 localStorage Token

**選擇**：JWT 簽發後以 `httpOnly; Secure; SameSite=Lax` Cookie 傳送，前端不直接持有 token。

**原因**：httpOnly Cookie 防止 XSS 讀取 token。由於 Angular app 與 API 同 origin（`/api` proxy），SameSite=Lax 提供 CSRF 足夠的防護。相較於 Authorization header 方案，Cookie 方案讓前端完全無感知 token，降低前端程式碼的安全複雜度。

**替代方案**：`localStorage` + Authorization header — 易被 XSS 竊取，捨棄。

---

### Decision 2：Watch List 嵌入 User Document，非獨立 Collection

**選擇**：`User.watchList: string[]` 直接嵌入。

**原因**：Watch list 數量小（預期 < 100 個 symbol）、永遠是 user-scoped、不需要跨 user 查詢、無複雜關聯。MongoDB 嵌入文件在此場景效能最佳且維護成本最低。

**替代方案**：獨立 `watchlists` collection — 過度工程，無實際優勢，捨棄。

---

### Decision 3：OAuth Callback 後 302 Redirect，非 JSON Response

**選擇**：`/api/auth/google/callback` 設定 JWT Cookie 後，302 redirect 到前端首頁 `/`。

**原因**：OAuth 流程本質上是瀏覽器跳轉，完成後 redirect 回 app 是標準模式。前端不需要處理 token，Angular app 啟動後呼叫 `/api/auth/me` 取得當前使用者狀態。

---

### Decision 4：研究助理 Auth Gate 在前端，API 也加 Guard

**選擇**：雙層防護。前端 `AuthService.isLoggedIn` 控制 UI 顯示；API `JwtAuthGuard` 保護 `/api/agent/market-research/*`。

**原因**：前端 gate 提供良好的 UX（顯示登入提示而非 401 錯誤）；API guard 確保安全性不依賴前端。

---

### Decision 5：NestJS auth 模組結構

```
apps/api/src/app/auth/
  auth.module.ts
  auth.controller.ts          ← GET /google, GET /google/callback, GET /me, POST /logout
  auth.service.ts             ← upsertUser(), signJwt()
  strategies/
    google.strategy.ts        ← PassportStrategy(Strategy, 'google')
    jwt.strategy.ts           ← PassportStrategy(Strategy, 'jwt') - 從 Cookie 讀取
  guards/
    google-auth.guard.ts
    jwt-auth.guard.ts
  schemas/
    user.schema.ts            ← Mongoose: googleId, email, name, picture, watchList[]
```

---

### Decision 6：Angular AuthService 使用 Signal

**選擇**：`currentUser = signal<UserProfile | null>(null)`，app 啟動時呼叫 `/api/auth/me` 初始化。

**原因**：與現有 Signals-first 架構一致（DashboardStateService、ResearchAssistantContextService 均使用 signal）。`isLoggedIn = computed(() => currentUser() !== null)` 讓各元件可以 reactive 地回應登入狀態。

## Risks / Trade-offs

| 風險 | 緩解方式 |
|------|---------|
| Cookie SameSite=Lax 在跨 origin 部署時失效 | 生產環境確保 Angular 與 API 同 origin；若需跨 origin 改用 SameSite=None + Secure |
| JWT 無法主動撤銷（無 refresh token） | 設定短 expiry（如 7 天）；登出時清除 Cookie（無法真正 revoke，但 Cookie 刪除後前端無法自動帶上） |
| Google OAuth Callback URL 需要在 Google Cloud Console 預先設定 | 文件化 `GOOGLE_CALLBACK_URL` 環境變數，本機與生產各一組 |
| 使用者刪除 Google 帳號後無法再登入 | 目前範圍不處理帳號刪除情境，後續有需要再加 |

## Migration Plan

1. 部署前先在 Google Cloud Console 建立 OAuth 2.0 Client，取得 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
2. 設定環境變數：`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`JWT_SECRET`、`GOOGLE_CALLBACK_URL`（如 `https://formoatlas.example.com/api/auth/google/callback`）
3. 部署新版本：MongoDB `users` collection 自動建立（Mongoose auto-create）
4. Rollback：移除 auth module、還原 agent controller（無資料破壞性）

## Open Questions

- Watch List 頁面是獨立 route（如 `/watchlist`），還是嵌在現有 Toolbar 的 Dropdown？ → **決定：以獨立頁面呈現，目前前端 UI 尚未實作，WatchlistPanelComponent 已移除。**
- Agent API 是否要記錄使用量（per user quota）？目前 proposal 未提，先不做。
