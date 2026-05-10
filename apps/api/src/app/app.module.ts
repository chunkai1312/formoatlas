import * as path from 'path';
import { Module, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MongooseModule } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import { MarketDataModule } from './marketdata/marketdata.module';
import { BarometerModule } from './barometer/barometer.module';
import { MarketResearchAgentModule } from './agent/market-research-agent.module';
import { AuthModule } from './auth/auth.module';
import { MarketStatsService } from './marketdata/services/market-stats.service';
import { TickerService } from './marketdata/services/ticker.service';
import { CopilotRuntimeModule } from './copilot/copilot-runtime.module';
import { BacktestingModule } from './backtesting/backtesting.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, 'assets'),
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    MarketDataModule,
    CopilotRuntimeModule,
    BarometerModule,
    MarketResearchAgentModule,
    AuthModule,
    BacktestingModule,
  ]
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    private readonly marketStatsService: MarketStatsService,
    private readonly tickerService: TickerService
  ) {}

  async onApplicationBootstrap() {
    if (process.env.MARKETDATA_INIT_ENABLED === 'true') {
      Logger.log('正在初始化應用程式...', AppModule.name);

      const days = parseInt(process.env.MARKETDATA_INIT_DAYS as string, 10) || 30;
      const startDate = DateTime.local().minus({ days });
      const endDate = DateTime.local();

      for (let dt = startDate; dt <= endDate; dt = dt.plus({ day: 1 })) {
        try {
          await this.marketStatsService.updateMarketStats(dt.toISODate());
          await this.tickerService.updateTickers(dt.toISODate());
        } catch (error) {
          dt = dt.minus({ day: 1 });
          continue;
        }
      }

      Logger.log('應用程式初始化完成', AppModule.name);
    }
  }
}
