## 1. 後端依賴安裝與設定

- [x] 1.1 安裝 `@nestjs/passport`, `passport`, `passport-google-oauth20`, `@types/passport-google-oauth20`, `@nestjs/jwt`, `passport-jwt`, `@types/passport-jwt`, `cookie-parser`, `@types/cookie-parser`
- [x] 1.2 在 `apps/api/src/main.ts` 加入 `cookieParser()` middleware
- [x] 1.3 在 `.env` 加入 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`JWT_SECRET`、`GOOGLE_CALLBACK_URL` 環境變數

## 2. User Schema 與 Auth 模組骨架

- [x] 2.1 建立 `apps/api/src/app/auth/schemas/user.schema.ts`（Mongoose schema：googleId, email, name, picture, watchList[]）
- [x] 2.2 建立 `apps/api/src/app/auth/auth.module.ts`，匯入 MongooseModule、PassportModule、JwtModule
- [x] 2.3 建立 `apps/api/src/app/auth/auth.service.ts`，實作 `upsertUser()` 與 `signJwt()`
- [x] 2.4 在 `AppModule` 匯入 `AuthModule`

## 3. Passport Strategies 與 Guards

- [x] 3.1 建立 `apps/api/src/app/auth/strategies/google.strategy.ts`（PassportStrategy with GoogleStrategy）
- [x] 3.2 建立 `apps/api/src/app/auth/strategies/jwt.strategy.ts`（從 Cookie 讀取 JWT）
- [x] 3.3 建立 `apps/api/src/app/auth/guards/google-auth.guard.ts`
- [x] 3.4 建立 `apps/api/src/app/auth/guards/jwt-auth.guard.ts`

## 4. Auth Controller（OAuth 端點）

- [x] 4.1 建立 `apps/api/src/app/auth/auth.controller.ts`，實作 `GET /api/auth/google`（觸發 Google OAuth redirect）
- [x] 4.2 實作 `GET /api/auth/google/callback`（upsert user、簽 JWT、設 httpOnly Cookie、302 redirect 到 `/`）
- [x] 4.3 實作 `GET /api/auth/me`（受 JwtAuthGuard 保護，回傳當前使用者 profile）
- [x] 4.4 實作 `POST /api/auth/logout`（清除 JWT Cookie，回傳 200）

## 5. Watch List API

- [x] 5.1 建立 `apps/api/src/app/auth/user.controller.ts`，受 JwtAuthGuard 保護
- [x] 5.2 實作 `GET /api/user/watchlist`（回傳使用者 watchList[]）
- [x] 5.3 實作 `POST /api/user/watchlist/:symbol`（冪等新增，回傳更新後 watchList）
- [x] 5.4 實作 `DELETE /api/user/watchlist/:symbol`（冪等移除，回傳更新後 watchList）

## 6. 研究助理 API 加 Auth Guard

- [x] 6.1 在 `MarketResearchAgentController` 的兩個端點（POST、stream）加上 `@UseGuards(JwtAuthGuard)`
- [x] 6.2 驗證未登入 request 收到 401（`POST /api/agent/market-research` 與 `.../stream` 均回傳 401 ✓）

## 7. 前端 AuthService

- [x] 7.1 建立 `apps/web/src/app/core/models/user.model.ts`（`UserProfile` interface）
- [x] 7.2 建立 `apps/web/src/app/core/services/auth.service.ts`，實作 `currentUser` signal、`isLoggedIn` computed、`loadCurrentUser()`、`login()`、`logout()`
- [x] 7.3 在 `app.config.ts` 的 `APP_INITIALIZER` 或 `appRoutes` resolver 呼叫 `AuthService.loadCurrentUser()`，確保 app 啟動時 auth 狀態已初始化

## 8. Toolbar 登入狀態 UI

- [x] 8.1 在 Toolbar 元件注入 `AuthService`，加入登入/登出按鈕
- [x] 8.2 已登入時顯示使用者頭像（Google picture）與下拉選單（含登出選項）
- [x] 8.3 未登入時顯示「登入」按鈕，點擊呼叫 `AuthService.login()`

## 9. 研究助理 Auth Gate（前端）

- [x] 9.1 在 `ResearchAssistantComponent` 注入 `AuthService`
- [x] 9.2 未登入時，panel 顯示登入提示（「需要登入才能使用研究助理」+ Google 登入按鈕）
- [x] 9.3 已登入時，panel 顯示原有的問題輸入介面

## 10. Watch List 前端（基礎）

- [x] 10.1 建立 `apps/web/src/app/core/services/watchlist.service.ts`，封裝 Watch List API CRUD
- [~] 10.2 ~~Toolbar Watch List icon button~~（已移除，Watch List 未來以獨立頁面呈現）
- [~] 10.3 ~~WatchlistPanelComponent（slide-in 面板）~~（已移除，`watchlist-panel/` 目錄已刪除）
