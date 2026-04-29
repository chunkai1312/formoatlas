import { MarketResearchContextDto } from './dto/market-research-query.dto';
import { MarketResearchAgentOutput } from './market-research-agent.schema';
import { AgentMessageRole, AgentMessageStatus } from './schemas/agent-message.schema';

export interface AgentConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string;
  contextSnapshot?: MarketResearchContextDto;
}

export interface AgentConversationMessage {
  id: string;
  role: AgentMessageRole;
  status: AgentMessageStatus;
  question?: string;
  answer?: MarketResearchAgentOutput;
  date: string;
  context?: MarketResearchContextDto;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AgentConversationDetail extends AgentConversationSummary {
  messages: AgentConversationMessage[];
}
