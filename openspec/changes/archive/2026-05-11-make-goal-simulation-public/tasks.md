## 1. 後端 API

- [x] 1.1 移除 `GoalSimulationController` 上的 `JwtAuthGuard`
- [x] 1.2 更新 API operation summary，避免標示會員限定
- [x] 1.3 更新 controller 測試：不再期待 guard metadata，改驗證公開 controller 仍 delegate request

## 2. 前端 UI

- [x] 2.1 移除 `/goal-simulation` 未登入 auth gate
- [x] 2.2 讓未登入使用者也可看到表單並提交目標模擬
- [x] 2.3 移除或改寫「登入會員後可執行目標模擬」文案
- [x] 2.4 確認登入提示 dialog 不再由目標模擬提交流程觸發

## 3. 測試與驗證

- [x] 3.1 更新前端單元測試：未登入狀態應顯示表單與提交 action
- [x] 3.2 更新或移除既有登入 gate 相關 expectations
- [x] 3.3 執行 `npx nx test api`
- [x] 3.4 執行 `npx nx test web`
- [x] 3.5 執行 `openspec validate make-goal-simulation-public --strict`

## 4. OpenSpec

- [x] 4.1 確認 `goal-based-strategy-simulation` delta 覆蓋公開 API 與公開 UI 行為
- [x] 4.2 確認本變更未擴入保存、比較、匯出或會員進階能力
