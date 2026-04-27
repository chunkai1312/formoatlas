import { MarketResearchAgentOutput } from './market-research-agent.schema';

export type MarketResearchStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'tool_start'; toolName: string; message: string }
  | { type: 'tool_result'; toolName: string; message: string; ok: boolean }
  | { type: 'final'; answer: MarketResearchAgentOutput }
  | { type: 'error'; message: string };

export type MarketResearchEventEmitter = (event: MarketResearchStreamEvent) => void;
