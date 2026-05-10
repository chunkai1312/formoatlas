## 背景

FormoAtlas 目前已有：

- Google OAuth + JWT httpOnly Cookie 會員登入。
- `JwtAuthGuard` 可保護會員 API。
- 個股頁 `/stocks/:symbol`，已載入個股摘要與最多 5 年 OHLC。
- `TickerRepository.getOhlcBySymbol()` 與 `getStockSummary()` 可提供回測所需 OHLCV 基礎資料。

這次變更的核心是把既有 OHLC 資料接到回測引擎，讓會員能在單股頁快速驗證策略，並為後續「目標報酬導向」策略模擬留下清楚邊界。

## 目標 / 非目標

**目標：**
- 會員限定執行回測，訪客看到登入 gate。
- 單股買進持有與 SMA 均線交叉策略，參數可調。
- 使用 `node-backtesting`，避免自研基礎回測引擎。
- 不保存結果，降低資料模型與隱私複雜度。
- 回傳可繪圖的權益曲線、回撤與交易明細。
- 在設計上預留目標報酬導向策略模擬。

**非目標：**
- 不支援使用者自訂程式碼策略。
- 不做付費會員權限。
- 不做即時交易、下單串接或通知。
- 不保證推薦策略能達成目標。

## 架構

```text
apps/api/src/app/backtesting/
  backtesting.module.ts
  backtesting.controller.ts       # POST /api/backtesting/run, JwtAuthGuard
  backtesting.service.ts          # 驗證區間、讀取 OHLC、執行回測
  dto/
    run-backtest.dto.ts
  strategies/
    buy-and-hold.strategy.ts      # 買進持有 Strategy adapter
    sma-cross.strategy.ts         # node-backtesting Strategy adapter
  types/
    backtest-result.types.ts
```

前端：

```text
apps/web/src/app/core/services/backtesting.service.ts
apps/web/src/app/core/models/backtesting.model.ts
apps/web/src/app/features/stock-detail/
  components/backtest-panel/
```

## 設計決策

### 決策 1：第一版使用 `node-backtesting` 作為回測引擎

**選擇**：使用 `node-backtesting` 的 `Backtest`、`Strategy`、`crossover`、`crossunder` 與繪圖 / 統計概念，但由 FormoAtlas API 統一整理 response。

**原因**：它已支援 columnar OHLC historical data、策略類別、指標 / signal、最佳化、trailing stop、交易統計與 Plotly 多面板圖概念。MVP 的買進持有與 SMA cross 都能透過 Strategy adapter 表達，可降低回測引擎風險。

**取捨**：不直接暴露 library 原始物件給前端，避免未來更換回測引擎時破壞 API contract。

### 決策 2：只在伺服器端執行回測

**選擇**：回測在 NestJS API 執行，前端只送參數。

**原因**：OHLC 資料在後端，會員權限也在後端；伺服器端可以統一做參數限制、資料範圍限制與風險揭露。

### 決策 3：MVP 不保存回測紀錄

**選擇**：第一版不建立 `backtest_runs` collection。

**原因**：使用者目前需求是驗證策略，不需要歷史紀錄。先不儲存可以避免 retention、刪除、配額與付費等權限議題。

### 決策 4：目標報酬模擬是獨立 capability

**選擇**：`member-backtesting` 專注回答「這個策略過去怎麼樣」；`goal-based-strategy-simulation` 回答「在目標與風險限制下，哪些候選策略比較接近」。

**原因**：兩者共用歷史模擬能力，但產品語意不同。若把目標報酬直接塞入單股回測，很容易變成不當的買賣建議或過度承諾。

## Request / Response 形狀

第一階段回測 request：

```ts
type RunBacktestRequest = {
  symbol: string;
  strategy: 'buy-and-hold' | 'sma-cross';
  startDate?: string;
  endDate?: string;
  initialCash: number;
  feeRate?: number;
  taxRate?: number;
  tradeOnClose?: boolean;
  params?: {
    shortWindow?: number;
    longWindow?: number;
    orderSize?: number;
  };
};
```

第一階段 response：

```ts
type BacktestResult = {
  symbol: string;
  strategy: 'buy-and-hold' | 'sma-cross';
  requestedRange: { startDate: string; endDate: string };
  resolvedRange: { startDate: string; endDate: string };
  params: Record<string, number | boolean>;
  metrics: {
    finalEquity: number;
    totalReturnPct: number;
    annualizedReturnPct: number | null;
    maxDrawdownPct: number | null;
    winRatePct: number | null;
    tradeCount: number;
    buyHoldReturnPct: number | null;
  };
  equityCurve: Array<{ date: string; equity: number }>;
  drawdownCurve: Array<{ date: string; drawdownPct: number }>;
  trades: Array<{
    entryDate: string;
    exitDate?: string;
    entryPrice: number;
    exitPrice?: number;
    size: number;
    pnl?: number;
    returnPct?: number;
  }>;
  benchmark?: {
    strategy: 'buy-and-hold';
    metrics: BacktestResult['metrics'];
    equityCurve: BacktestResult['equityCurve'];
    drawdownCurve: BacktestResult['drawdownCurve'];
    trades: BacktestTrade[];
  };
  warnings: string[];
};
```

`buy-and-hold` 策略若未指定 `orderSize`，系統應以初始資金盡量買滿；`sma-cross` 策略必須指定 `shortWindow`、`longWindow` 與 `orderSize`。SMA 回測結果應額外回傳買進持有 benchmark，讓使用者可以比較主策略是否優於單純持有。

## 目標報酬延伸

後續 capability 的 request 形狀應從目標出發：

```ts
type GoalSimulationRequest = {
  targetAmount?: number;
  targetAnnualReturnPct?: number;
  horizonYears: number;
  initialCapital: number;
  monthlyContribution: number;
  maxDrawdownTolerancePct?: number;
  universe: {
    type: 'single-symbol' | 'watchlist' | 'market' | 'allocation';
    symbols?: string[];
  };
  candidateStrategies: Array<'sma-cross' | 'momentum' | 'allocation-model'>;
};
```

輸出應是候選策略比較，而非單一保證推薦：

- 達標率或接近目標程度。
- 年化報酬、最大回撤、最差區間。
- 需要提高投入 / 延長期限 / 降低目標的提示。
- 明確標示「歷史情境模擬，不構成投資建議」。

## 風險與緩解

| 風險 | 緩解方式 |
|------|----------|
| 使用者把回測誤解為保證獲利 | UI 與 API warnings 固定顯示歷史模擬與非投資建議 |
| 參數最佳化造成 overfitting | MVP 不做最佳化；後續最佳化需顯示樣本外驗證或 overfit warning |
| 回測使用當根 K 線訊號造成 look-ahead bias | 策略需明確定義 signal bar 與成交 bar；MVP 預設收盤成交時要在說明中揭露 |
| API 被大量呼叫 | 第一階段可先限制日期範圍與參數大小；後續再加 per-user quota |
| `node-backtesting` API 變動 | FormoAtlas 自己定義 response contract，不暴露 library internals |

## 待確認問題

- 成交成本預設值要使用多少？暫定手續費率與證交稅都可由 request 帶入，UI 提供台股常見預設。
- SMA cross 的買賣語意：cross up 買進固定 `orderSize`，cross down 平掉目前多單。
- OHLC 不足 `longWindow` 時要回 400，避免誤讀。
