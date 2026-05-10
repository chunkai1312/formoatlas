export type GoalSimulationCandidateStrategy = 'buy-and-hold';

export interface RunGoalSimulationRequest {
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
}

export interface GoalSimulationCandidateResult {
  strategy: GoalSimulationCandidateStrategy;
  label: string;
  status: 'available' | 'unavailable';
  unavailableReason?: string;
  goalAttainmentRate: number | null;
  projectedFinalValue: number | null;
  targetGap: number | null;
  metrics: {
    totalReturnPct: number | null;
    annualizedReturnPct: number | null;
    maxDrawdownPct: number | null;
    worstPeriod: {
      startDate: string;
      endDate: string;
      drawdownPct: number;
    } | null;
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
