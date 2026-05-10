## 1. Backtesting API Foundation

- [x] 1.1 安裝並驗證 `node-backtesting` 可在 NestJS/Vitest 環境中 import 與執行
- [x] 1.2 建立 `BacktestingModule`、controller、service 與 DTO 骨架
- [x] 1.3 以 `JwtAuthGuard` 保護 `POST /api/backtesting/run`
- [x] 1.4 定義並驗證 `RunBacktestDto`：symbol、strategy、date range、initialCash、fee/tax、SMA params、orderSize

## 2. Data Adapter and Strategy

- [x] 2.1 從 `TickerRepository.getOhlcBySymbol()` 取得回測資料並轉為 `node-backtesting` historical data
- [x] 2.2 實作 SMA cross strategy adapter，使用 short/long window 與 fixed order size
- [x] 2.2a 實作 buy-and-hold strategy adapter，支援指定股數或以初始資金盡量買滿
- [x] 2.3 加入資料不足、日期區間無資料、無效參數的錯誤處理
- [x] 2.4 整理 `node-backtesting` 結果為 FormoAtlas API response contract

## 3. Metrics and Risk Warnings

- [x] 3.1 回傳 final equity、total return、annualized return、max drawdown、win rate、trade count、buy-and-hold return
- [x] 3.2 回傳 equity curve、drawdown curve、trades
- [x] 3.2a SMA cross response 額外回傳 buy-and-hold benchmark
- [x] 3.3 在 response warnings 中固定加入歷史模擬 / 非投資建議提示
- [x] 3.4 明確揭露成交假設與交易成本設定

## 4. Stock Detail UI

- [x] 4.1 新增 backtesting model 與 Angular service
- [x] 4.2 在個股頁新增回測面板；未登入時顯示既有登入提示
- [x] 4.3 登入後可設定初始資金、期間、短均線、長均線、股數、交易成本並執行
- [x] 4.4 顯示績效摘要、權益曲線、回撤與交易明細
- [x] 4.5 在 K 線圖或回測圖表中標示買賣點（若實作成本過高可延到 v1.1）
- [x] 4.6 新增策略切換，支援買進持有與 SMA cross，並在 SMA 結果顯示 benchmark
- [x] 4.7 將買進持有設為回測面板預設策略

## 5. Tests and Validation

- [x] 5.1 後端單元測試：未登入拒絕、參數驗證、資料不足、成功回測
- [x] 5.2 後端單元測試：SMA cross 策略輸出穩定交易結果
- [x] 5.3 前端單元測試：登入 gate、表單提交、結果呈現、錯誤狀態
- [x] 5.3a 測試買進持有 request 與 SMA benchmark 顯示
- [x] 5.3b 測試回測面板預設買進持有
- [x] 5.4 執行 `npx nx test api` 與 `npx nx test web`

## 6. Future Goal-Based Simulation Capture

- [x] 6.1 保留 API/model 命名，避免單股回測 contract 阻礙後續 goal simulation
- [x] 6.2 後續另開 change 實作 `goal-based-strategy-simulation`
