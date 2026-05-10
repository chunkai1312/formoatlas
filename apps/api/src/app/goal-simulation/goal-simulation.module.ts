import { Module } from '@nestjs/common';
import { MarketDataModule } from '../marketdata/marketdata.module';
import { GoalSimulationController } from './goal-simulation.controller';
import { GoalSimulationService } from './goal-simulation.service';

@Module({
  imports: [MarketDataModule],
  controllers: [GoalSimulationController],
  providers: [GoalSimulationService],
})
export class GoalSimulationModule {}
