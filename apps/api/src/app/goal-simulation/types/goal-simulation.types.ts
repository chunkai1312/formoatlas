export type GoalSimulationCandidateStrategy = 'buy-and-hold';
export type GoalSimulationCandidateStatus = 'available' | 'unavailable';

export interface GoalSimulationMetricSet {
  totalReturnPct: number | null;
  annualizedReturnPct: number | null;
  maxDrawdownPct: number | null;
  worstPeriod: {
    startDate: string;
    endDate: string;
    drawdownPct: number;
  } | null;
}

export interface GoalSimulationTradeRecord {
  date: string;
  action: 'buy';
  reason: 'initial-capital' | 'monthly-contribution';
  price: number;
  shares: number;
  amount: number;
  cashAfter: number;
}

export interface GoalSimulationCandidateResult {
  strategy: GoalSimulationCandidateStrategy;
  label: string;
  status: GoalSimulationCandidateStatus;
  unavailableReason?: string;
  goalAttainmentRate: number | null;
  projectedFinalValue: number | null;
  targetGap: number | null;
  metrics: GoalSimulationMetricSet;
  equityCurve: Array<{ date: string; value: number }>;
  drawdownCurve: Array<{ date: string; drawdownPct: number }>;
  tradeRecords: GoalSimulationTradeRecord[];
  suggestions: string[];
  warnings: string[];
}

export interface GoalSimulationResult {
  universe: {
    type: 'single-symbol';
    symbols: string[];
  };
  requestedHorizonYears: number;
  requestedRange: {
    startDate: string;
    endDate: string;
  };
  resolvedRange: {
    startDate: string;
    endDate: string;
  };
  target: {
    targetAmount: number;
    source: 'targetAmount' | 'targetAnnualReturnPct';
    targetAnnualReturnPct?: number;
  };
  costAssumption: {
    mode: 'ignored' | 'default-tw-equity';
    feeRate: number | null;
    taxRate: number | null;
    description: string;
  };
  cashflow: {
    initialCapital: number;
    monthlyContribution: number;
    contributionEvents: number;
    totalContributed: number;
  };
  candidates: GoalSimulationCandidateResult[];
  warnings: string[];
}
