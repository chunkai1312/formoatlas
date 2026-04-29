import { DateTime } from 'luxon';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sumBy } from 'lodash';
import { TwStock } from 'node-twstock';
import { InjectTwStock } from 'nest-twstock';
import { TickerType, Exchange, Market, Index } from '../enums';
import { EquityRepository } from '../repositories/equity.repository';
import { TickerRepository } from '../repositories/ticker.repository';
import { isOtcWarrant } from '../utils';

function calcConsecutiveDays(net: number, prev: number): number {
  if (net > 0) return prev > 0 ? prev + 1 : 1;
  if (net < 0) return prev < 0 ? prev - 1 : -1;
  return 0;
}

@Injectable()
export class TickerService {
  constructor(
    @InjectTwStock() private readonly twstock: TwStock,
    private readonly tickerRepository: TickerRepository,
    private readonly equityRepository: EquityRepository,
  ) {}

  async updateTickers(date: string = DateTime.local().toISODate()) {
    const updates = [
      [this.updateTwseIndicesQuotes, this.updateTpexIndicesQuotes],
      [this.updateTwseMarketTrades, this.updateTpexMarketTrades],
      [this.updateTwseIndicesTrades, this.updateTpexIndicesTrades],
      [this.updateTwseEquitiesQuotes, this.updateTpexEquitiesQuotes],
      [this.updateTwseEquitiesInstInvestorsTrades, this.updateTpexEquitiesInstInvestorsTrades],
      [this.updateTwseEquityProfiles, this.updateTpexEquityProfiles],
    ];

    for (const group of updates) {
      await Promise.all(group.map(update => update.call(this, date)));
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    Logger.log(`${date} 上市櫃行情已更新`, TickerService.name);
  }

  @Cron('0 0 14 * * *')
  async updateTwseIndicesQuotes(date: string = DateTime.local().toISODate()) {
    const updated = await this.twstock.indices.historical({ date, exchange: 'TWSE' })
      .then((data: any) => data && data.map(ticker => ({
        date: ticker.date,
        type: TickerType.Index,
        exchange: Exchange.TWSE,
        market: Market.TSE,
        symbol: ticker.symbol,
        name: ticker.name,
        openPrice: ticker.open,
        highPrice: ticker.high,
        lowPrice: ticker.low,
        closePrice: ticker.close,
        change: ticker.change,
        changePercent: parseFloat((ticker.change / parseFloat((ticker.close - ticker.change).toFixed(2)) * 100).toFixed(2)),
      })))
      .then(data => data && Promise.all(data.map(ticker => this.tickerRepository.updateTicker(ticker))));

    if (updated) Logger.log(`${date} 上市指數收盤行情: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上市指數收盤行情: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 0 14 * * *')
  async updateTpexIndicesQuotes(date: string = DateTime.local().toISODate()) {
    const updated = await this.twstock.indices.historical({ date, exchange: 'TPEx' })
      .then((data: any) => data && data.map(ticker => ({
        date: ticker.date,
        type: TickerType.Index,
        exchange: Exchange.TPEx,
        market: Market.OTC,
        symbol: ticker.symbol,
        name: ticker.name,
        openPrice: ticker.open,
        highPrice: ticker.high,
        lowPrice: ticker.low,
        closePrice: ticker.close,
        change: ticker.change,
        changePercent: parseFloat((ticker.change / parseFloat((ticker.close - ticker.change).toFixed(2)) * 100).toFixed(2)),
      })))
      .then(data => data && Promise.all(data.map(ticker => this.tickerRepository.updateTicker(ticker))));

    if (updated) Logger.log(`${date} 上櫃指數收盤行情: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上櫃指數收盤行情: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 30 14 * * *')
  async updateTwseMarketTrades(date: string = DateTime.local().toISODate()) {
    const updated = await this.twstock.market.trades({ date, exchange: 'TWSE' })
      .then(data => data && {
        date: data.date,
        type: TickerType.Index,
        exchange: Exchange.TWSE,
        market: Market.TSE,
        symbol: Index.TAIEX,
        tradeVolume: data.tradeVolume,
        tradeValue: data.tradeValue,
        transaction: data.transaction,
      })
      .then(ticker => ticker && this.tickerRepository.updateTicker(ticker));

    if (updated) Logger.log(`${date} 上市大盤成交量值: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上市大盤成交量值: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 30 14 * * *')
  async updateTpexMarketTrades(date: string = DateTime.local().toISODate()) {
    const updated = await this.twstock.market.trades({ date, exchange: 'TPEx' })
      .then(data => data && {
        date: data.date,
        type: TickerType.Index,
        exchange: Exchange.TPEx,
        market: Market.OTC,
        symbol: Index.TPEX,
        tradeVolume: data.tradeVolume,
        tradeValue: data.tradeValue,
        transaction: data.transaction,
      })
      .then(ticker => ticker && this.tickerRepository.updateTicker(ticker));

    if (updated) Logger.log(`${date} 上櫃大盤成交量值: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上櫃大盤成交量值: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 0 15 * * *')
  async updateTwseIndicesTrades(date: string = DateTime.local().toISODate()) {
    const updated = await this.twstock.indices.trades({ date, exchange: 'TWSE' })
      .then((data: any) => data && data.map(ticker => ({
        date: ticker.date,
        type: TickerType.Index,
        exchange: Exchange.TWSE,
        market: Market.TSE,
        symbol: ticker.symbol,
        tradeVolume: ticker.tradeVolume,
        tradeValue: ticker.tradeValue,
        tradeWeight: ticker.tradeWeight,
      })))
      .then(data => data && Promise.all(data.map(ticker => this.tickerRepository.updateTicker(ticker))));

    if (updated) Logger.log(`${date} 上市類股成交量值: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上市類股成交量值: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 0 15 * * *')
  async updateTpexIndicesTrades(date: string = DateTime.local().toISODate()) {
    const updated = await this.twstock.indices.trades({ date, exchange: 'TPEx' })
      .then((data: any) => data && data.map(ticker => ({
        date: ticker.date,
        type: TickerType.Index,
        exchange: Exchange.TPEx,
        market: Market.OTC,
        symbol: ticker.symbol,
        tradeVolume: ticker.tradeVolume,
        tradeValue: ticker.tradeValue,
        tradeWeight: ticker.tradeWeight,
      })))
      .then(data => data && Promise.all(data.map(ticker => this.tickerRepository.updateTicker(ticker))));

    if (updated) Logger.log(`${date} 上櫃類股成交量值: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上櫃類股成交量值: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 0 15-21/2 * * *')
  async updateTwseEquitiesQuotes(date: string = DateTime.local().toISODate()) {
    const updated = await this.twstock.stocks.historical({ date, exchange: 'TWSE' })
      .then((data: any) => data && data.map(ticker => ({
        date: ticker.date,
        type: TickerType.Equity,
        exchange: Exchange.TWSE,
        market: Market.TSE,
        symbol: ticker.symbol,
        name: ticker.name,
        openPrice: ticker.open,
        highPrice: ticker.high,
        lowPrice: ticker.low,
        closePrice: ticker.close,
        change: ticker.change || 0,
        changePercent: parseFloat((ticker.change / parseFloat((ticker.close - ticker.change).toFixed(2)) * 100).toFixed(2)) || 0,
        tradeVolume: ticker.volume,
        tradeValue: ticker.turnover,
        transaction: ticker.transaction,
      })))
      .then(data => data && Promise.all(data.map(ticker => this.tickerRepository.updateTicker(ticker))));

    if (updated) Logger.log(`${date} 上市個股收盤行情: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上市個股收盤行情: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 0 15-21/2 * * *')
  async updateTpexEquitiesQuotes(date: string = DateTime.local().toISODate()) {
    const updated = await this.twstock.stocks.historical({ date, exchange: 'TPEx' })
      .then((data: any) => data && data
        .filter(ticker => !isOtcWarrant(ticker.symbol))
        .map(ticker => ({
        date: ticker.date,
        type: TickerType.Equity,
        exchange: Exchange.TPEx,
        market: Market.OTC,
        symbol: ticker.symbol,
        name: ticker.name,
        openPrice: ticker.open,
        highPrice: ticker.high,
        lowPrice: ticker.low,
        closePrice: ticker.close,
        change: ticker.change || 0,
        changePercent: parseFloat((ticker.change / parseFloat((ticker.close - ticker.change).toFixed(2)) * 100).toFixed(2)) || 0,
        tradeVolume: ticker.volume,
        tradeValue: ticker.turnover,
        transaction: ticker.transaction,
      })))
      .then(data => data && Promise.all(data.map(ticker => this.tickerRepository.updateTicker(ticker))));

    if (updated) Logger.log(`${date} 上櫃個股收盤行情: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上櫃個股收盤行情: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 30 16 * * *')
  async updateTwseEquitiesInstInvestorsTrades(date: string = DateTime.local().toISODate()) {
    const rawData = await this.twstock.stocks.institutional({ date, exchange: 'TWSE' }) as any[];
    if (!rawData) {
      Logger.warn(`${date} 上市個股法人進出: 尚無資料或非交易日`, TickerService.name);
      return;
    }

    const tickers = rawData.map(ticker => {
      const finiRows = ticker.institutional.filter(row => ['外資及陸資(不含外資自營商)', '外資自營商'].includes(row.investor));
      const sitcRows = ticker.institutional.filter(row => ['投信'].includes(row.investor));
      const dealersRows = ticker.institutional.filter(row => ['自營商(自行買賣)', '自營商(避險)'].includes(row.investor));
      return {
        date: ticker.date,
        type: TickerType.Equity,
        exchange: Exchange.TWSE,
        market: Market.TSE,
        symbol: ticker.symbol,
        instInvestors: {
          fini:    { buy: sumBy(finiRows, 'totalBuy'),    sell: sumBy(finiRows, 'totalSell'),    net: sumBy(finiRows, 'difference') },
          sitc:    { buy: sumBy(sitcRows, 'totalBuy'),    sell: sumBy(sitcRows, 'totalSell'),    net: sumBy(sitcRows, 'difference') },
          dealers: { buy: sumBy(dealersRows, 'totalBuy'), sell: sumBy(dealersRows, 'totalSell'), net: sumBy(dealersRows, 'difference') },
        },
      };
    });

    const symbols = tickers.map(t => t.symbol);
    const prevDaysMap = await this.tickerRepository.getPrevInstConsecutiveDaysBatch(symbols, date, Market.TSE);

    const tickersWithDays = tickers.map(ticker => ({
      ...ticker,
      instInvestors: {
        ...ticker.instInvestors,
        fini: { ...ticker.instInvestors.fini, consecutiveDays: calcConsecutiveDays(ticker.instInvestors.fini.net, prevDaysMap.get(ticker.symbol)?.fini ?? 0) },
        sitc: { ...ticker.instInvestors.sitc, consecutiveDays: calcConsecutiveDays(ticker.instInvestors.sitc.net, prevDaysMap.get(ticker.symbol)?.sitc ?? 0) },
      },
    }));

    await Promise.all(tickersWithDays.map(ticker => this.tickerRepository.updateTicker(ticker)));
    Logger.log(`${date} 上市個股法人進出: 已更新`, TickerService.name);
  }

  @Cron('0 30 16 * * *')
  async updateTpexEquitiesInstInvestorsTrades(date: string = DateTime.local().toISODate()) {
    const rawData = await this.twstock.stocks.institutional({ date, exchange: 'TPEx' }) as any[];
    if (!rawData) {
      Logger.warn(`${date} 上櫃個股法人進出: 尚無資料或非交易日`, TickerService.name);
      return;
    }

    const tickers = rawData.filter(ticker => !isOtcWarrant(ticker.symbol)).map(ticker => {
      const finiRows = ticker.institutional.filter(row => ['外資及陸資(不含外資自營商)', '外資自營商'].includes(row.investor));
      const sitcRows = ticker.institutional.filter(row => ['投信'].includes(row.investor));
      const dealersRows = ticker.institutional.filter(row => ['自營商(自行買賣)', '自營商(避險)'].includes(row.investor));
      return {
        date: ticker.date,
        type: TickerType.Equity,
        exchange: Exchange.TPEx,
        market: Market.OTC,
        symbol: ticker.symbol,
        instInvestors: {
          fini:    { buy: sumBy(finiRows, 'totalBuy'),    sell: sumBy(finiRows, 'totalSell'),    net: sumBy(finiRows, 'difference') },
          sitc:    { buy: sumBy(sitcRows, 'totalBuy'),    sell: sumBy(sitcRows, 'totalSell'),    net: sumBy(sitcRows, 'difference') },
          dealers: { buy: sumBy(dealersRows, 'totalBuy'), sell: sumBy(dealersRows, 'totalSell'), net: sumBy(dealersRows, 'difference') },
        },
      };
    });

    const symbols = tickers.map(t => t.symbol);
    const prevDaysMap = await this.tickerRepository.getPrevInstConsecutiveDaysBatch(symbols, date, Market.OTC);

    const tickersWithDays = tickers.map(ticker => ({
      ...ticker,
      instInvestors: {
        ...ticker.instInvestors,
        fini: { ...ticker.instInvestors.fini, consecutiveDays: calcConsecutiveDays(ticker.instInvestors.fini.net, prevDaysMap.get(ticker.symbol)?.fini ?? 0) },
        sitc: { ...ticker.instInvestors.sitc, consecutiveDays: calcConsecutiveDays(ticker.instInvestors.sitc.net, prevDaysMap.get(ticker.symbol)?.sitc ?? 0) },
      },
    }));

    await Promise.all(tickersWithDays.map(ticker => this.tickerRepository.updateTicker(ticker)));
    Logger.log(`${date} 上櫃個股法人進出: 已更新`, TickerService.name);
  }

  @Cron('0 0 17 * * *')
  async updateTwseEquityProfiles(date: string = DateTime.local().toISODate()) {
    // 1. 取得上市股票清單，過濾普通股，upsert industryCode
    const stockList = await this.twstock.stocks.list({ exchange: 'TWSE' }) as any[];
    if (!stockList) {
      Logger.warn(`${date} 上市個股基本資料: stocks.list() 無回傳`, TickerService.name);
      return;
    }

    const commonStocks = stockList.filter((s: any) => s.type === '股票');

    await Promise.all(
      commonStocks.map((s: any) =>
        this.equityRepository.upsertEquity({
          symbol: s.symbol,
          exchange: Exchange.TWSE,
          name: s.name,
          industryCode: s.industry ?? '00',
        }),
      ),
    );

    // 2. 取得發行股數，假日/非交易日回 null 時僅略過，保留既有值
    const holdings = await this.twstock.stocks.finiHoldings({ date, exchange: 'TWSE' }) as any[] | null;
    if (!holdings) {
      Logger.warn(`${date} 上市個股發行股數: 非交易日，僅更新產業代碼`, TickerService.name);
      return;
    }

    await Promise.all(
      holdings.map((h: any) =>
        this.equityRepository.upsertEquity({
          symbol: h.symbol,
          exchange: Exchange.TWSE,
          issuedShares: h.issuedShares,
        }),
      ),
    );

    Logger.log(`${date} 上市個股基本資料（產業/發行股數）: 已更新`, TickerService.name);
  }

  @Cron('0 5 17 * * *')
  async updateTpexEquityProfiles(date: string = DateTime.local().toISODate()) {
    // 1. 取得上櫃股票清單，過濾普通股，upsert industryCode
    const stockList = await this.twstock.stocks.list({ exchange: 'TPEx' }) as any[];
    if (!stockList) {
      Logger.warn(`${date} 上櫃個股基本資料: stocks.list() 無回傳`, TickerService.name);
      return;
    }

    const commonStocks = stockList.filter((s: any) => s.type === '股票');

    await Promise.all(
      commonStocks.map((s: any) =>
        this.equityRepository.upsertEquity({
          symbol: s.symbol,
          exchange: Exchange.TPEx,
          name: s.name,
          industryCode: s.industry ?? '00',
        }),
      ),
    );

    // 2. 取得發行股數，假日/非交易日回 null 時僅略過，保留既有值
    const holdings = await this.twstock.stocks.finiHoldings({ date, exchange: 'TPEx' }) as any[] | null;
    if (!holdings) {
      Logger.warn(`${date} 上櫃個股發行股數: 非交易日，僅更新產業代碼`, TickerService.name);
      return;
    }

    await Promise.all(
      holdings.map((h: any) =>
        this.equityRepository.upsertEquity({
          symbol: h.symbol,
          exchange: Exchange.TPEx,
          issuedShares: h.issuedShares,
        }),
      ),
    );

    Logger.log(`${date} 上櫃個股基本資料（產業/發行股數）: 已更新`, TickerService.name);
  }
}
