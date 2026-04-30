export type MarketResearchSourceType =
  | 'market-stats'
  | 'barometer'
  | 'sector-flow'
  | 'hot-stocks'
  | 'ticker-ohlc'
  | 'stock-summary';

export type AssistantMode = 'research' | 'scan' | 'stock';

export interface MarketResearchContext {
  route?: string;
  market?: 'TSE' | 'OTC';
  symbol?: string;
  sector?: string;
}

export interface MarketResearchQuery {
  question: string;
  date: string;
  mode?: AssistantMode;
  context?: MarketResearchContext;
}

export interface MarketResearchEvidence {
  sourceType: MarketResearchSourceType;
  label: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  market?: 'TSE' | 'OTC';
  sector?: string;
  symbol?: string;
}

export interface MarketResearchFinding {
  title: string;
  detail: string;
  evidenceIndexes: number[];
}

export interface MarketResearchResponse {
  summary: string;
  keyFindings: MarketResearchFinding[];
  evidence: MarketResearchEvidence[];
  followUpQuestions: string[];
  warnings: string[];
}

export type MarketResearchStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'tool_start'; toolName: string; message: string }
  | { type: 'tool_result'; toolName: string; message: string; ok: boolean }
  | { type: 'final'; answer: MarketResearchResponse }
  | { type: 'error'; message: string };
