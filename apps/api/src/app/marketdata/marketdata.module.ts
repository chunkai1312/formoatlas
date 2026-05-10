import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TwStockModule } from 'nest-twstock';
import { Equity, EquitySchema } from './schemas/equity.schema';
import { MarketStats, MarketStatsSchema } from './schemas/market-stats.schema';
import { PriceAdjustmentEvent, PriceAdjustmentEventSchema } from './schemas/price-adjustment-event.schema';
import { Ticker, TickerSchema } from './schemas/ticker.schema';
import { EquityRepository } from './repositories/equity.repository';
import { MarketStatsRepository } from './repositories/market-stats.repository';
import { PriceAdjustmentEventRepository } from './repositories/price-adjustment-event.repository';
import { TickerRepository } from './repositories/ticker.repository';
import { AdjustedPriceService } from './services/adjusted-price.service';
import { MarketStatsService } from './services/market-stats.service';
import { PriceAdjustmentEventService } from './services/price-adjustment-event.service';
import { TickerService } from './services/ticker.service';
import { MarketDataController } from './marketdata.controller';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Equity.name, schema: EquitySchema },
      { name: MarketStats.name, schema: MarketStatsSchema },
      { name: PriceAdjustmentEvent.name, schema: PriceAdjustmentEventSchema },
      { name: Ticker.name, schema: TickerSchema },
    ]),
    TwStockModule.register(),
  ],
  controllers: [
    MarketDataController,
  ],
  providers: [
    EquityRepository,
    MarketStatsRepository,
    PriceAdjustmentEventRepository,
    AdjustedPriceService,
    MarketStatsService,
    PriceAdjustmentEventService,
    TickerRepository,
    TickerService,
  ],
  exports: [
    EquityRepository,
    MarketStatsRepository,
    PriceAdjustmentEventRepository,
    AdjustedPriceService,
    MarketStatsService,
    PriceAdjustmentEventService,
    TickerRepository,
    TickerService,
  ],
})
export class MarketDataModule {}
