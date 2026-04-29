## ADDED Requirements

### Requirement: Google OAuth 登入流程
系統 SHALL 提供 Google OAuth 2.0 登入流程，讓使用者以 Google 帳戶登入。

#### Scenario: 使用者發起 Google 登入
- **WHEN** 使用者點擊登入按鈕或被重導到 `GET /api/auth/google`
- **THEN** 系統 SHALL 302 redirect 到 Google OAuth 授權頁面

#### Scenario: Google 授權成功
- **WHEN** 使用者完成 Google 授權，Google 回傳 callback 到 `GET /api/auth/google/callback`
- **THEN** 系統 SHALL 在 MongoDB 中 upsert 使用者資料（googleId、email、name、picture），簽發 JWT，以 httpOnly Cookie 回傳，並 302 redirect 到前端首頁

#### Scenario: Google 授權被使用者拒絕
- **WHEN** 使用者在 Google 授權頁拒絕授權
- **THEN** 系統 SHALL 302 redirect 到前端首頁，不建立 session

### Requirement: JWT Session 管理
系統 SHALL 以 httpOnly Cookie 儲存 JWT session，不在 localStorage 或 response body 中暴露 token。

#### Scenario: 取得當前使用者
- **WHEN** client 帶有效 JWT Cookie 呼叫 `GET /api/auth/me`
- **THEN** 系統 SHALL 回傳 `{ sub, email, name, picture }` JSON，不含敏感資料

#### Scenario: 未登入時取得當前使用者
- **WHEN** client 不帶 JWT Cookie 或帶無效 Cookie 呼叫 `GET /api/auth/me`
- **THEN** 系統 SHALL 回傳 401

#### Scenario: 使用者登出
- **WHEN** client 呼叫 `POST /api/auth/logout`
- **THEN** 系統 SHALL 清除 JWT Cookie 並回傳 200
