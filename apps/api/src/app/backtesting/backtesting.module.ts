import { Module } from '@nestjs/common';
import { MarketDataModule } from '../marketdata/marketdata.module';
import { BacktestingController } from './backtesting.controller';
import { BacktestingService } from './backtesting.service';

@Module({
  imports: [MarketDataModule],
  controllers: [BacktestingController],
  providers: [BacktestingService],
})
export class BacktestingModule {}
