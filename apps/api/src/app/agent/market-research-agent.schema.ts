import { z } from 'zod';

export const AgentEvidenceSchema = z.object({
  sourceType: z.enum(['market-stats', 'barometer', 'sector-flow', 'hot-stocks', 'ticker-ohlc', 'stock-summary']),
  label: z.string().min(1).max(160),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  market: z.enum(['TSE', 'OTC']).optional(),
  sector: z.string().optional(),
  symbol: z.string().optional(),
});

export const AgentKeyFindingSchema = z.object({
  title: z.string().min(1).max(80),
  detail: z.string().min(1).max(360),
  evidenceIndexes: z.array(z.number().int().nonnegative()).default([]),
});

export const MarketResearchAgentOutputSchema = z.object({
  summary: z.string().min(1).max(900),
  keyFindings: z.array(AgentKeyFindingSchema).min(1).max(6),
  evidence: z.array(AgentEvidenceSchema).max(12),
  followUpQuestions: z.array(z.string().min(1).max(120)).max(4).default([]),
  warnings: z.array(z.string().min(1).max(180)).max(5).default([]),
});

export type MarketResearchAgentOutput = z.infer<typeof MarketResearchAgentOutputSchema>;
export type MarketResearchEvidence = z.infer<typeof AgentEvidenceSchema>;
