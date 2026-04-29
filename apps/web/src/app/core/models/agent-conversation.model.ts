import { MarketResearchContext, MarketResearchResponse, MarketResearchStreamEvent } from './market-research-agent.model';

export interface AgentConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string;
  contextSnapshot?: MarketResearchContext;
}

export interface AgentConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  status: 'completed' | 'failed';
  question?: string;
  answer?: MarketResearchResponse;
  date: string;
  context?: MarketResearchContext;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AgentConversationDetail extends AgentConversationSummary {
  messages: AgentConversationMessage[];
}

export interface CreateAgentConversationRequest {
  title?: string;
  context?: MarketResearchContext;
}

export type AgentConversationStreamEvent = MarketResearchStreamEvent;
