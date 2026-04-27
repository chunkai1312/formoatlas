import { Module } from '@nestjs/common';
import { MarketDataModule } from '../marketdata/marketdata.module';
import { MarketResearchAgentController } from './market-research-agent.controller';
import { MarketResearchAgentService } from './market-research-agent.service';
import { MarketResearchAgentTools } from './market-research-agent.tools';

@Module({
  imports: [MarketDataModule],
  controllers: [MarketResearchAgentController],
  providers: [MarketResearchAgentService, MarketResearchAgentTools],
})
export class MarketResearchAgentModule {}
