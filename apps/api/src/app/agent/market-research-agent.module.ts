import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketDataModule } from '../marketdata/marketdata.module';
import { AgentConversationController } from './agent-conversation.controller';
import { AgentConversationService } from './agent-conversation.service';
import { MarketResearchAgentController } from './market-research-agent.controller';
import { MarketResearchAgentService } from './market-research-agent.service';
import { MarketResearchAgentTools } from './market-research-agent.tools';
import { AgentConversation, AgentConversationSchema } from './schemas/agent-conversation.schema';
import { AgentMessage, AgentMessageSchema } from './schemas/agent-message.schema';

@Module({
  imports: [
    MarketDataModule,
    MongooseModule.forFeature([
      { name: AgentConversation.name, schema: AgentConversationSchema },
      { name: AgentMessage.name, schema: AgentMessageSchema },
    ]),
  ],
  controllers: [MarketResearchAgentController, AgentConversationController],
  providers: [MarketResearchAgentService, MarketResearchAgentTools, AgentConversationService],
})
export class MarketResearchAgentModule {}
