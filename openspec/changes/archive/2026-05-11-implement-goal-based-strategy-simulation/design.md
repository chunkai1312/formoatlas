## Context

目標模擬要回答的是：在指定財務目標、投入條件與歷史區間下，單一股票買進持有是否曾經接近或達成目標。第一版不提供策略最佳化或多策略比較，以降低 UI 與投資語意複雜度。

本設計保留 response 的 `candidates` 陣列，但第一版只回傳一筆 `buy-and-hold` candidate。這讓前端與未來擴充保有彈性，同時避免讓使用者誤以為系統正在推薦 SMA 或配置策略。

## Goals / Non-Goals

**Goals:**

- 會員限定執行目標導向買進持有模擬。
- 使用獨立 API：`POST /api/goal-simulation/run`。
- 第一版支援 `single-symbol` universe，且只支援一檔股票。
- 支援目標金額或目標 money-weighted 年化報酬。
- 支援投資年限、歷史模擬開始/結束日期、初始本金、每月投入與最大回撤容忍。
- 前端預設股票代號使用 `0050`，並可由 URL query params 帶入表單初始設定。
- 使用 adjusted OHLC，降低除權息、減資、面額變更與 ETF 分割造成的價格跳空干擾。
- 使用一致現金流排程計算目標金額、總投入與 XIRR。
- 回傳期末權益總值、目標缺口、達成率、總報酬、XIRR、最大回撤、最差區間、交易紀錄、資產曲線與回撤曲線。
- 明確揭露第一版未扣交易成本與歷史模擬限制。

**Non-Goals:**

- 不支援 SMA、cash allocation、多策略比較或策略最佳化。
- 不支援 watchlist、market、多資產 allocation、rolling window 或 Monte Carlo。
- 不處理房貸、利率、稅費、頭期款等房地產專屬模型。
- 不保存模擬結果。
- 不提供買賣建議、下單建議或保證達成結論。

## Architecture

```text
apps/api/src/app/goal-simulation/
  goal-simulation.module.ts
  goal-simulation.controller.ts      # POST /api/goal-simulation/run, JwtAuthGuard
  goal-simulation.service.ts         # request validation, adjusted OHLC, buy-and-hold simulation, metrics
  dto/
    run-goal-simulation.dto.ts
  types/
    goal-simulation.types.ts
```

前端：

```text
apps/web/src/app/core/models/goal-simulation.model.ts
apps/web/src/app/core/services/goal-simulation.service.ts
apps/web/src/app/features/goal-simulation/goal-simulation.component.ts
```

## URL Query Params

目標模擬頁 SHALL 支援以 query params 初始化表單，但不自動提交模擬，也不在使用者編輯欄位時反向同步 URL。

支援參數：

- `symbol`
- `targetMode`: `amount` 或 `annual-return`
- `targetAmount`
- `targetAnnualReturnPct`
- `horizonYears`
- `startDate`
- `endDate`
- `initialCapital`
- `monthlyContribution`
- `maxDrawdownTolerancePct`

數值參數只有在可解析為有限數字時才覆蓋預設值；日期參數只有在符合 `YYYY-MM-DD` 格式時才覆蓋預設值。

## Request Model

```ts
type GoalSimulationRequest = {
  targetAmount?: number;
  targetAnnualReturnPct?: number;
  horizonYears: number;
  startDate?: string;
  endDate?: string;
  initialCapital: number;
  monthlyContribution: number;
  maxDrawdownTolerancePct?: number;
  universe: {
    type: 'single-symbol';
    symbols: string[];
  };
};
```

`targetAmount` 與 `targetAnnualReturnPct` 至少需提供一個。若只提供 `targetAnnualReturnPct`，系統使用 resolved trading dates 與每月第一個可用交易日投入排程反推目標期末資產。

若未提供 `endDate`，系統以今日作為 requested end date。若未提供 `startDate`，系統以 requested end date 往前 `horizonYears` 作為 requested start date。

## Response Model

```ts
type GoalSimulationResult = {
  universe: { type: 'single-symbol'; symbols: string[] };
  requestedHorizonYears: number;
  requestedRange: { startDate: string; endDate: string };
  resolvedRange: { startDate: string; endDate: string };
  target: {
    targetAmount: number;
    source: 'targetAmount' | 'targetAnnualReturnPct';
    targetAnnualReturnPct?: number;
  };
  cashflow: {
    initialCapital: number;
    monthlyContribution: number;
    contributionEvents: number;
    totalContributed: number;
  };
  costAssumption: {
    mode: 'ignored' | 'default-tw-equity';
    feeRate: number | null;
    taxRate: number | null;
    description: string;
  };
  candidates: GoalSimulationCandidateResult[];
  warnings: string[];
};

type GoalSimulationCandidateResult = {
  strategy: 'buy-and-hold';
  label: string;
  status: 'available';
  goalAttainmentRate: number;
  projectedFinalValue: number;
  targetGap: number;
  metrics: {
    totalReturnPct: number | null;
    annualizedReturnPct: number | null;
    maxDrawdownPct: number | null;
    worstPeriod: { startDate: string; endDate: string; drawdownPct: number } | null;
  };
  equityCurve: Array<{ date: string; value: number }>;
  drawdownCurve: Array<{ date: string; drawdownPct: number }>;
  tradeRecords: Array<{
    date: string;
    action: 'buy';
    reason: 'initial-capital' | 'monthly-contribution';
    price: number;
    shares: number;
    amount: number;
    cashAfter: number;
  }>;
  suggestions: string[];
  warnings: string[];
};
```

## Simulation Model

1. Resolve requested date range from request or defaults.
2. Query OHLC by symbol and requested range.
3. Apply adjusted OHLC before simulation.
4. Use the actual first/last available candle as `resolvedRange`.
5. Build contribution schedule from resolved trading dates:
   - initial capital at resolved start date
   - monthly contribution at the first available trading day of each later month
   - final portfolio value at resolved end date
6. Buy as many whole shares as possible at resolved start date and each contribution date.
7. Hold shares until resolved end date, keeping residual cash uninvested.
8. Record each actual buy transaction with date, price, shares, amount, cash after trade and whether it came from initial capital or monthly contribution.
9. Build daily equity curve and drawdown curve.
10. Compute target gap, goal attainment rate as `finalValue / targetAmount * 100`, total return, XIRR, max drawdown and worst period.
11. Return warnings for historical simulation limits, adjusted price assumption and transaction cost assumption.

## Decisions

### 1. 固定買進持有策略

第一版不要求 request 提供 `candidateStrategies` 或 `strategyParams`。後端只回傳一筆 `buy-and-hold` candidate，前端不顯示策略選擇、SMA 參數或配置比例。

### 2. `horizonYears` 與 historical date range 分離

`horizonYears` 代表財務目標期限；`startDate` / `endDate` 代表用哪段歷史資料做情境模擬。兩者可能不完全相等，因此 response 同時揭露 requested/resolved range。

URL query params 只初始化表單值，不改變後端 date range contract。

### 3. 年化報酬採 XIRR

定期投入情境下，單純用 `finalValue / totalContributed` 估算年化報酬會失真。`metrics.annualizedReturnPct` 使用 money-weighted return（XIRR）。若 XIRR 無法收斂，回傳 `null` 並加入 candidate warning。

### 4. 交易成本先揭露不扣除

第一版不建交易事件明細，因此 `costAssumption.mode = 'ignored'`，`feeRate` 與 `taxRate` 為 `null`。response warnings 與 UI 成本假設需揭露未扣交易成本。

### 5. 圖表資料放在 candidate result

資產曲線與回撤曲線是買進持有 candidate 的輸出，放在 candidate result 可保留未來擴充到多策略時的資料位置。

### 6. 交易紀錄放在 candidate result

交易紀錄描述買進持有 candidate 實際完成的買進交易，因此放在 candidate result。第一版僅記錄 `buy`，不建立未成交的投入事件，也不扣除手續費與證交稅。

## Risks / Trade-offs

| 風險 | 緩解方式 |
|------|----------|
| 使用者誤以為歷史結果代表未來保證 | response 固定揭露歷史模擬、不構成投資建議、不保證未來績效 |
| XIRR 可能無法收斂 | 限制迭代；不收斂時回傳 null 與 warning |
| 長區間曲線 payload 增加 | 第一版單一股票、單一 candidate 可接受 |
| 未扣交易成本使結果偏樂觀 | response/UI 固定揭露未扣交易成本，後續可另開 change 納入成本模型 |
