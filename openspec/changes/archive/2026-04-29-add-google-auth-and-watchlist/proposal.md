## Why

目前 FormoAtlas 的所有功能對訪客完全開放，但 研究助理（Agent）與即將推出的 Watch List 屬於個人化功能，需要穩固的使用者身份才能保存資料並跨設備同步。透過 Google OAuth 提供低 friction 的登入方式，讓個人化功能有可靠的基礎。

## What Changes

- 新增 Google OAuth 2.0 登入流程（後端 Passport.js + 前端跳轉）
- 新增 JWT httpOnly Cookie session 管理
- 新增 `/api/auth/*` 端點（登入、callback、取得當前使用者、登出）
- 新增 MongoDB `User` collection，儲存 Google 帳號資訊與 watch list
- 新增 `/api/user/watchlist` CRUD 端點，受 JWT Guard 保護
- **研究助理（Agent）改為需要登入才能使用**，訪客看到登入提示而非被踢出
- 新增 Watch List 功能：使用者可新增/移除關注的股票代號
- Toolbar 新增使用者頭像與登入/登出按鈕

## Capabilities

### New Capabilities

- `google-auth`: Google OAuth 2.0 登入流程、JWT session、使用者 MongoDB document
- `user-watchlist`: Watch List CRUD API 與前端管理介面

### Modified Capabilities

- `market-research-agent`: 研究助理需要登入才能使用（新增 auth gate 需求）

## Impact

- **後端**：新增 `auth` NestJS 模組，新增 `@nestjs/passport`、`passport-google-oauth20`、`@nestjs/jwt`、`cookie-parser` 依賴
- **前端**：新增 `AuthService`（signal-based），Toolbar 新增登入狀態顯示，研究助理 panel 新增 auth gate
- **MongoDB**：新增 `users` collection
- **環境變數**：新增 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`JWT_SECRET`、`SESSION_CALLBACK_URL`
- **Dockerfile / 部署**：環境變數需同步更新
