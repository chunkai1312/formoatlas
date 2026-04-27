import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DateTime } from 'luxon';
import { MarketStatsRepository } from './repositories/market-stats.repository';
import { TickerRepository } from './repositories/ticker.repository';
import { GetMarketStatsDto } from './dto/get-market-stats.dto';
import { GetTickerOhlcDto } from './dto/get-ticker-ohlc.dto';
import { GetSectorFlowDto } from './dto/get-sector-flow.dto';
import { GetHotStocksDto } from './dto/get-hot-stocks.dto';
import { GetMarketMapDto } from './dto/get-market-map.dto';
import { GetTradingDateDto } from './dto/get-trading-date.dto';

@ApiTags('marketdata')
@Controller('marketdata')
export class MarketDataController {
  constructor(
    private readonly marketStatsRepository: MarketStatsRepository,
    private readonly tickerRepository: TickerRepository,
  ) {}

  @ApiOperation({ summary: '取得指定日期當天或之前最近的交易日' })
  @Get('trading-date')
  async getLatestTradingDate(@Query() query: GetTradingDateDto) {
    const before = query.before ?? DateTime.local().toISODate();
    const result = await this.marketStatsRepository.getLatestTradingDate(before);
    if (!result) throw new NotFoundException('No trading date found before ' + before);
    return result;
  }

  @ApiOperation({ summary: '取得大盤籌碼資料' })
  @Get('market-stats')
  getMarketStats(@Query() query: GetMarketStatsDto) {
    return this.marketStatsRepository.getMarketStats({
      startDate: query.startDate ?? DateTime.local().minus({ months: 3 }).toISODate(),
      endDate: query.endDate ?? DateTime.local().toISODate(),
    });
  }

  @ApiOperation({ summary: '取得 Ticker OHLC 收盤行情' })
  @Get('tickers')
  getTickers(@Query() query: GetTickerOhlcDto) {
    return this.tickerRepository.getOhlcBySymbol({
      symbol: query.symbol,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }

  @ApiOperation({ summary: '取得產業資金流向排行（TSE 上市 / OTC 上櫃）' })
  @Get('sector-flow')
  getSectorFlow(@Query() query: GetSectorFlowDto) {
    return this.tickerRepository.getSectorFlow({ date: query.date, market: query.market });
  }

  @ApiOperation({ summary: '取得熱門個股排行（TSE 上市 / OTC 上櫃）' })
  @Get('hot-stocks')
  getHotStocks(@Query() query: GetHotStocksDto) {
    return this.tickerRepository.getHotStocks({ date: query.date, market: query.market });
  }

  @ApiOperation({ summary: '取得市場熱力圖（TSE 上市 / OTC 上櫃全市場個股，依產業分組）' })
  @Get('market-map')
  getMarketMap(@Query() query: GetMarketMapDto) {
    return this.tickerRepository.getMarketMap({ date: query.date, market: query.market });
  }
}
