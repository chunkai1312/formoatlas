export type BacktestStrategy = 'buy-and-hold' | 'sma-cross';

export interface RunBacktestRequest {
  symbol: string;
  strategy: BacktestStrategy;
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
}

export interface BacktestTrade {
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  size: number;
  pnl?: number;
  returnPct?: number;
}

export interface BacktestResult {
  symbol: string;
  strategy: BacktestStrategy;
  requestedRange: { startDate: string; endDate: string };
  resolvedRange: { startDate: string; endDate: string };
  params: {
    initialCash: number;
    shortWindow?: number;
    longWindow?: number;
    orderSize?: number;
    feeRate: number;
    taxRate: number;
    effectiveCommissionRate: number;
    tradeOnClose: boolean;
  };
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
  trades: BacktestTrade[];
  benchmark?: {
    strategy: 'buy-and-hold';
    metrics: BacktestResult['metrics'];
    equityCurve: BacktestResult['equityCurve'];
    drawdownCurve: BacktestResult['drawdownCurve'];
    trades: BacktestTrade[];
  };
  warnings: string[];
}
