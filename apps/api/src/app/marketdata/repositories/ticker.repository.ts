import * as _ from 'lodash';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DateTime } from 'luxon';
import { Ticker, TickerDocument } from '../schemas/ticker.schema';
import { TickerType, Market, Index, Exchange } from '../enums';
import { getSectorName, getIndustryName } from '../utils';
import { HotStockRankRow, HotStocksResponse } from '../types/hot-stocks.types';
import { MarketMapItem, MarketMapSector, MarketMapResponse } from '../types/market-map.types';
import { TickerMetadata } from '../types/ticker-metadata.types';
import { StockSummaryHotStockRank, StockSummaryResponse } from '../types/stock-summary.types';

const HOT_STOCK_RANK_DEFS: Array<{
  key: string;
  label: string;
  tone: StockSummaryHotStockRank['tone'];
  getRows: (hotStocks: HotStocksResponse) => HotStockRankRow[];
}> = [
  { key: 'movers.gainers', label: '漲幅榜', tone: 'positive', getRows: hotStocks => hotStocks.movers.gainers },
  { key: 'movers.losers', label: '跌幅榜', tone: 'negative', getRows: hotStocks => hotStocks.movers.losers },
  { key: 'actives.byValue', label: '成交金額排行', tone: 'neutral', getRows: hotStocks => hotStocks.actives.byValue },
  { key: 'actives.byVolume', label: '成交量排行', tone: 'neutral', getRows: hotStocks => hotStocks.actives.byVolume },
  { key: 'institutional.finiBuy', label: '外資買超', tone: 'positive', getRows: hotStocks => hotStocks.institutional.finiBuy },
  { key: 'institutional.finiSell', label: '外資賣超', tone: 'negative', getRows: hotStocks => hotStocks.institutional.finiSell },
  { key: 'institutional.sitcBuy', label: '投信買超', tone: 'positive', getRows: hotStocks => hotStocks.institutional.sitcBuy },
  { key: 'institutional.sitcSell', label: '投信賣超', tone: 'negative', getRows: hotStocks => hotStocks.institutional.sitcSell },
];

@Injectable()
export class TickerRepository {
  constructor(
    @InjectModel(Ticker.name) private readonly model: Model<TickerDocument>,
  ) {}

  async updateTicker(ticker: Partial<Ticker>) {
    const { date, symbol } = ticker;
    return this.model.updateOne({ date, symbol }, ticker, { upsert: true });
  }

  async getTickers(options?: { startDate?: string, endDate?: string }) {
    const startDate = options?.startDate ?? DateTime.local().toISODate();
    const endDate = options?.endDate ?? DateTime.local().toISODate();

    return this.model
      .find({ date: { $gte: startDate, $lte: endDate } })
      .select({ _id: 0, __v: 0, createdAt: 0 , updatedAt: 0 })
      .sort({ date: -1, symbol: 1 })
      .lean()
      .exec();
  }

  async getOhlcBySymbol(options: { symbol: string, startDate?: string, endDate?: string, adjusted?: boolean }) {
    const startDate = options.startDate ?? DateTime.local().minus({ months: 3 }).toISODate();
    const endDate = options.endDate ?? DateTime.local().toISODate();

    return this.model
      .find({ symbol: options.symbol, date: { $gte: startDate, $lte: endDate } })
      .select({ _id: 0, date: 1, openPrice: 1, highPrice: 1, lowPrice: 1, closePrice: 1, tradeVolume: 1, tradeValue: 1, tradeWeight: 1 })
      .sort({ date: 1 })
      .lean()
      .exec();
  }

  async getStockSummary(options: { symbol: string; date?: string }): Promise<StockSummaryResponse | null> {
    const requestedDate = options.date ?? DateTime.local().toISODate();
    const symbol = options.symbol.trim().toUpperCase();
    if (!symbol) return null;

    const latest = await this.model.aggregate<any>([
      {
        $match: {
          symbol,
          date: { $lte: requestedDate },
          type: TickerType.Equity,
          market: { $in: [Market.TSE, Market.OTC] },
        },
      },
      { $sort: { date: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'equities',
          let: { sym: '$symbol', exch: '$exchange' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$symbol', '$$sym'] },
                    { $eq: ['$exchange', '$$exch'] },
                  ],
                },
              },
            },
          ],
          as: 'equityInfo',
        },
      },
      { $unwind: { path: '$equityInfo', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 } },
    ]).exec();

    const ticker = latest[0];
    if (!ticker) return null;

    const exchange = ticker.exchange as Exchange;
    const market = ticker.market === Market.OTC ? Market.OTC : Market.TSE;
    const industryCode = ticker.equityInfo?.industryCode ?? null;
    const industryName = industryCode ? getIndustryName(industryCode) : null;
    const issuedShares = ticker.equityInfo?.issuedShares ?? null;
    const closePrice = ticker.closePrice ?? 0;
    const tradeValue = ticker.tradeValue ?? 0;
    const marketCap = issuedShares && closePrice ? issuedShares * closePrice : null;
    const ohlcStartDate = DateTime.fromISO(ticker.date).minus({ years: 5 }).toISODate();

    const [ohlc, sectorTradeValue, hotStocks] = await Promise.all([
      this.getOhlcBySymbol({ symbol, startDate: ohlcStartDate, endDate: ticker.date }),
      industryCode ? this.getSectorTradeValue({ date: ticker.date, market, exchange, industryCode }) : Promise.resolve(null),
      this.getHotStocks({ date: ticker.date, market: market === Market.OTC ? 'OTC' : 'TSE' }),
    ]);

    const hotStockRanks = this.getHotStockRanksForSymbol(hotStocks, symbol);
    const hotStockLists = hotStockRanks.map(rank => rank.key);

    return {
      requestedDate,
      date: ticker.date,
      symbol: ticker.symbol,
      name: ticker.name ?? ticker.equityInfo?.name ?? ticker.symbol,
      market: market === Market.OTC ? 'OTC' : 'TSE',
      exchange: ticker.exchange,
      industryCode,
      industryName,
      quote: {
        openPrice: ticker.openPrice ?? 0,
        highPrice: ticker.highPrice ?? 0,
        lowPrice: ticker.lowPrice ?? 0,
        closePrice,
        change: ticker.change ?? 0,
        changePercent: ticker.changePercent ?? 0,
        tradeVolume: ticker.tradeVolume ?? 0,
        tradeValue,
        transaction: ticker.transaction ?? 0,
      },
      institutional: {
        finiNet: ticker.instInvestors?.fini?.net ?? null,
        sitcNet: ticker.instInvestors?.sitc?.net ?? null,
        dealersNet: ticker.instInvestors?.dealers?.net ?? null,
        finiConsecutiveDays: ticker.instInvestors?.fini?.consecutiveDays ?? null,
        sitcConsecutiveDays: ticker.instInvestors?.sitc?.consecutiveDays ?? null,
      },
      marginTrading: ticker.marginTrading
        ? {
            marginBalance: ticker.marginTrading.marginBalance ?? 0,
            marginBalanceChange: ticker.marginTrading.marginBalanceChange ?? 0,
            shortBalance: ticker.marginTrading.shortBalance ?? 0,
            shortBalanceChange: ticker.marginTrading.shortBalanceChange ?? 0,
            marginBuy: ticker.marginTrading.marginBuy ?? 0,
            marginSell: ticker.marginTrading.marginSell ?? 0,
            marginRedeem: ticker.marginTrading.marginRedeem ?? 0,
            shortBuy: ticker.marginTrading.shortBuy ?? 0,
            shortSell: ticker.marginTrading.shortSell ?? 0,
            shortRedeem: ticker.marginTrading.shortRedeem ?? 0,
            offset: ticker.marginTrading.offset ?? 0,
            note: ticker.marginTrading.note ?? '',
          }
        : null,
      ohlc: ohlc.map(row => ({
        date: row.date,
        openPrice: row.openPrice ?? 0,
        highPrice: row.highPrice ?? 0,
        lowPrice: row.lowPrice ?? 0,
        closePrice: row.closePrice ?? 0,
        tradeVolume: row.tradeVolume ?? 0,
        tradeValue: row.tradeValue ?? 0,
      })),
      context: {
        appearsInHotStocks: hotStockRanks.length > 0,
        hotStockLists,
        hotStockRanks,
        marketCap,
        tradeValue,
        sectorTradeValue,
        sectorWeightByTradeValue: sectorTradeValue && sectorTradeValue > 0
          ? parseFloat((tradeValue / sectorTradeValue).toFixed(4))
          : null,
      },
    };
  }

  async getMetadataBySymbols(symbols: string[]): Promise<TickerMetadata[]> {
    const uniqueSymbols = [...new Set(symbols.map(symbol => symbol.trim().toUpperCase()).filter(Boolean))];
    if (!uniqueSymbols.length) return [];

    return this.model.aggregate<TickerMetadata>([
      {
        $match: {
          symbol: { $in: uniqueSymbols },
          type: TickerType.Equity,
          name: { $exists: true, $ne: '' },
        },
      },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$symbol',
          symbol: { $first: '$symbol' },
          name: { $first: '$name' },
          market: { $first: '$market' },
        },
      },
      {
        $project: {
          _id: 0,
          symbol: 1,
          name: 1,
          market: 1,
        },
      },
    ]).exec();
  }

  async getMoneyFlow(options?: { date?: string, market?: Market }) {
    const date = options?.date || DateTime.local().toISODate();
    const market = options?.market || Market.TSE;

    const results = await this.model.aggregate([
      { $match: {
          date: { $lte: date },
          type: TickerType.Index,
          market: market || { $ne: null },
          symbol: { $nin: [Index.NonElectronics, Index.NonFinance, Index.NonFinanceNonElectronics] },
        },
      },
      { $project: { _id: 0, __v: 0, createdAt: 0 , updatedAt: 0 } },
      { $group: { _id: '$date', data: { $push: '$$ROOT' } } },
      { $sort: { _id: -1 } },
      { $limit: 2 },
    ]);

    const [ tickers, tickersPrev ] = results.map(doc => doc.data);

    return tickers.map((doc: any) => {
      const data = doc as Record<string, any>;
      data.tradeValuePrev = _.find(tickersPrev, { symbol: doc.symbol }).tradeValue;
      data.tradeWeightPrev = _.find(tickersPrev, { symbol: doc.symbol }).tradeWeight;
      data.tradeValueChange = doc.tradeValue - data.tradeValuePrev;
      data.tradeWeightChange = parseFloat((doc.tradeWeight - data.tradeWeightPrev).toPrecision(12));
      return data;
    });
  }

  async getSectorFlow(options?: { date?: string; market?: 'TSE' | 'OTC' }) {
    const date = options?.date || DateTime.local().toISODate();
    const isOTC = options?.market === 'OTC';
    const marketFilter = isOTC ? Market.OTC : Market.TSE;
    const benchmarkSymbol = isOTC ? Index.TPEX : Index.TAIEX;

    const excludedSymbols = isOTC
      ? [
          Index.TPExElectronic, // IX0047 電子子類聚合
        ]
      : [
          Index.NonFinance,                          // IX0007 未含金融指數
          Index.NonElectronics,                      // IX0008 未含電子指數
          Index.NonFinanceNonElectronics,            // IX0009 未含金融電子指數
          Index.CementAndCeramic,                    // IX0013 水泥窯製類指數
          Index.PlasticAndChemical,                  // IX0014 塑膠化工類指數
          Index.Electrical,                          // IX0015 機電類指數
          Index.ChemicalBiotechnologyAndMedicalCare, // IX0019 化學生技醫療類指數
          Index.Electronics,                         // IX0027 電子工業類指數
        ];

    const results = await this.model.aggregate([
      { $match: {
          date: { $lte: date },
          type: TickerType.Index,
          market: marketFilter,
          symbol: { $nin: excludedSymbols },
        },
      },
      { $project: { _id: 0, date: 1, symbol: 1, name: 1, closePrice: 1, change: 1, changePercent: 1, tradeValue: 1, tradeWeight: 1 } },
      { $group: { _id: '$date', data: { $push: '$$ROOT' } } },
      { $sort: { _id: -1 } },
      { $limit: 2 },
    ]);

    if (!results.length) return [];

    const [tickers, tickersPrev] = results.map(doc => doc.data);
    const benchmark = tickers?.find((doc: any) => doc.symbol === benchmarkSymbol);

    return tickers
      .filter((doc: any) => doc.symbol !== benchmarkSymbol && doc.name)
      .map((doc: any) => {
        const prev = _.find(tickersPrev, { symbol: doc.symbol });
        const tradeValuePrev = prev?.tradeValue ?? 0;
        const tradeWeightPrev = prev?.tradeWeight ?? 0;
        return {
          symbol: doc.symbol,
          name: getSectorName(doc.name),
          date: doc.date,
          closePrice: doc.closePrice,
          change: doc.change,
          changePercent: doc.changePercent,
          tradeValue: doc.tradeValue,
          tradeValuePrev,
          tradeValueChange: doc.tradeValue - tradeValuePrev,
          tradeWeight: doc.tradeWeight,
          tradeWeightPrev,
          tradeWeightChange: parseFloat((doc.tradeWeight - tradeWeightPrev).toPrecision(12)),
          rs: benchmark?.closePrice ? parseFloat((doc.closePrice / benchmark.closePrice).toFixed(4)) : null,
        };
      });
  }

  async getTopMovers(options?: { date?: string, market?: Market, direction?: 'up' | 'down', top?: number }) {
    const date = options?.date ?? DateTime.local().toISODate();
    const market = options?.market ?? Market.TSE;
    const direction = options?.direction ?? 'up';
    const top = options?.top ?? 50;

    const results = await this.model.aggregate([
      { $match: {
          date: { $lte: date },
          type: TickerType.Equity,
          market: market ?? { $ne: null },
          changePercent: (direction === 'down') ? { $lt: 0 } : { $gt: 0 },
        },
      },
      { $project: { _id: 0, __v: 0, createdAt: 0 , updatedAt: 0 } },
      { $sort: { date: -1, changePercent: (direction === 'down') ? 1 : -1 } },
      { $group: { _id: '$date', data: { $push: '$$ROOT' } } },
      { $sort: { _id: -1 } },
      { $limit: 1 },
    ], { allowDiskUse: true });

    const [ tickers ] = results.map(doc => doc.data);
    return tickers.slice(0, top);
  }

  async getMostActives(options?: { date?: string, market?: Market, trade?: 'volume' | 'value', top?: number }) {
    const date = options?.date || DateTime.local().toISODate();
    const market = options?.market || Market.TSE;
    const trade = options?.trade || 'volume';
    const tradeKey = (trade === 'value') ? 'tradeValue' : 'tradeVolume';
    const top = options?.top || 50;

    const results = await this.model.aggregate([
      { $match: {
          date: { $lte: date },
          type: TickerType.Equity,
          market: market || { $ne: null },
        },
      },
      { $project: { _id: 0, __v: 0, createdAt: 0 , updatedAt: 0 } },
      { $sort: { date: -1, [tradeKey]: -1 } },
      { $group: { _id: '$date', data: { $push: '$$ROOT' } } },
      { $sort: { _id: -1 } },
      { $limit: 1 },
    ], { allowDiskUse: true });

    const [ tickers ] = results.map(doc => doc.data);
    return tickers.slice(0, top);
  }

  async getInstInvestorsTrades(options?: { date?: string, market?: Market, inst?: 'fini' | 'sitc' | 'dealers', net: 'buy' | 'sell', top?: number }) {
    const date = options?.date || DateTime.local().toISODate();
    const market = options?.market || Market.TSE;
    const inst = options?.inst || `fini`;
    const net = options?.net || 'buy';
    const top = options?.top || 50;
    const instKey = `instInvestors.${inst}.net`;

    const results = await this.model.aggregate([
      { $match: {
          date: { $lte: date },
          type: TickerType.Equity,
          market: market || { $ne: null },
          [instKey]: (net === 'sell') ? { $lt: 0 } : { $gt: 0 },
        },
      },
      { $project: { _id: 0, __v: 0, createdAt: 0 , updatedAt: 0 } },
      { $sort: { date: -1, [instKey]: (net === 'sell') ? 1 : -1 } },
      { $group: { _id: '$date', data: { $push: '$$ROOT' } } },
      { $sort: { _id: -1 } },
      { $limit: 1 },
    ], { allowDiskUse: true });

    const [ tickers ] = results.map(doc => doc.data);
    return tickers.slice(0, top);
  }

  async getPrevInstConsecutiveDaysBatch(
    symbols: string[],
    beforeDate: string,
    market: Market,
  ): Promise<Map<string, { fini: number; sitc: number }>> {
    const results = await this.model.aggregate<{
      _id: string;
      finiConsecutiveDays: number | null;
      sitcConsecutiveDays: number | null;
    }>([
      {
        $match: {
          date: { $lt: beforeDate },
          market,
          symbol: { $in: symbols },
          instInvestors: { $exists: true },
        },
      },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$symbol',
          finiConsecutiveDays: { $first: '$instInvestors.fini.consecutiveDays' },
          sitcConsecutiveDays: { $first: '$instInvestors.sitc.consecutiveDays' },
        },
      },
    ]).exec();

    const map = new Map<string, { fini: number; sitc: number }>();
    for (const r of results) {
      map.set(r._id, {
        fini: r.finiConsecutiveDays ?? 0,
        sitc: r.sitcConsecutiveDays ?? 0,
      });
    }
    return map;
  }

  async getHotStocks(options?: { date?: string; market?: 'TSE' | 'OTC' }): Promise<HotStocksResponse> {
    const requestedDate = options?.date || DateTime.local().toISODate();
    const market = options?.market === 'OTC' ? Market.OTC : Market.TSE;
    const responseMarket: 'TSE' | 'OTC' = options?.market === 'OTC' ? 'OTC' : 'TSE';
    const latestDate = await this.getLatestEquityDate(requestedDate, market);
    const empty = this.emptyHotStocksResponse(latestDate ?? requestedDate, responseMarket);

    if (!latestDate) return empty;

    const [
      gainers,
      losers,
      byVolume,
      byValue,
      finiBuy,
      finiSell,
      sitcBuy,
      sitcSell,
    ] = await Promise.all([
      this.getEquityRanking({ date: latestDate, market, sortKey: 'changePercent', sortDir: -1, filter: { changePercent: { $gt: 0 } } }),
      this.getEquityRanking({ date: latestDate, market, sortKey: 'changePercent', sortDir: 1, filter: { changePercent: { $lt: 0 } } }),
      this.getEquityRanking({ date: latestDate, market, sortKey: 'tradeVolume', sortDir: -1 }),
      this.getEquityRanking({ date: latestDate, market, sortKey: 'tradeValue', sortDir: -1 }),
      this.getEquityRanking({ date: latestDate, market, sortKey: 'instInvestors.fini.net', sortDir: -1, filter: { 'instInvestors.fini.net': { $gt: 0 } } }),
      this.getEquityRanking({ date: latestDate, market, sortKey: 'instInvestors.fini.net', sortDir: 1, filter: { 'instInvestors.fini.net': { $lt: 0 } } }),
      this.getEquityRanking({ date: latestDate, market, sortKey: 'instInvestors.sitc.net', sortDir: -1, filter: { 'instInvestors.sitc.net': { $gt: 0 } } }),
      this.getEquityRanking({ date: latestDate, market, sortKey: 'instInvestors.sitc.net', sortDir: 1, filter: { 'instInvestors.sitc.net': { $lt: 0 } } }),
    ]);

    return {
      date: latestDate,
      market: responseMarket,
      movers: { gainers, losers },
      actives: { byVolume, byValue },
      institutional: { finiBuy, finiSell, sitcBuy, sitcSell },
    };
  }

  private async getLatestEquityDate(date: string, market: Market): Promise<string | null> {
    const match = this.getEquityMatch({ date: { $lte: date }, market });
    const doc = await this.model
      .findOne(match)
      .select({ _id: 0, date: 1 })
      .sort({ date: -1 })
      .lean()
      .exec();

    return doc?.date ?? null;
  }

  private async getEquityRanking(options: {
    date: string;
    market: Market;
    sortKey: string;
    sortDir: 1 | -1;
    filter?: Record<string, any>;
    top?: number;
  }): Promise<HotStockRankRow[]> {
    const top = options.top ?? 20;

    return this.model.aggregate<HotStockRankRow>([
      {
        $match: this.getEquityMatch({
          date: options.date,
          market: options.market,
          filter: options.filter,
        }),
      },
      { $sort: { [options.sortKey]: options.sortDir, symbol: 1 } },
      { $limit: top },
      {
        $project: {
          _id: 0,
          symbol: 1,
          name: { $ifNull: ['$name', '$symbol'] },
          date: 1,
          market: 1,
          closePrice: { $ifNull: ['$closePrice', 0] },
          change: { $ifNull: ['$change', 0] },
          changePercent: { $ifNull: ['$changePercent', 0] },
          tradeVolume: { $ifNull: ['$tradeVolume', 0] },
          tradeValue: { $ifNull: ['$tradeValue', 0] },
          finiNet: { $ifNull: ['$instInvestors.fini.net', null] },
          sitcNet: { $ifNull: ['$instInvestors.sitc.net', null] },
          finiConsecutiveDays: { $ifNull: ['$instInvestors.fini.consecutiveDays', null] },
          sitcConsecutiveDays: { $ifNull: ['$instInvestors.sitc.consecutiveDays', null] },
        },
      },
    ]).exec();
  }

  private getEquityMatch(options: {
    date: string | { $lte: string };
    market: Market;
    filter?: Record<string, any>;
  }): Record<string, any> {
    return {
      date: options.date,
      type: TickerType.Equity,
      market: options.market,
      ...(options.filter ?? {}),
    };
  }

  private emptyHotStocksResponse(date: string, market: 'TSE' | 'OTC'): HotStocksResponse {
    return {
      date,
      market,
      movers: { gainers: [], losers: [] },
      actives: { byVolume: [], byValue: [] },
      institutional: { finiBuy: [], finiSell: [], sitcBuy: [], sitcSell: [] },
    };
  }

  private getHotStockRanksForSymbol(hotStocks: HotStocksResponse, symbol: string): StockSummaryHotStockRank[] {
    return HOT_STOCK_RANK_DEFS.flatMap((def) => {
      const index = def.getRows(hotStocks).findIndex(row => row.symbol === symbol);
      if (index < 0) return [];
      return [{
        key: def.key,
        label: def.label,
        rank: index + 1,
        tone: def.tone,
      }];
    });
  }

  private async getSectorTradeValue(options: {
    date: string;
    market: Market;
    exchange: Exchange;
    industryCode: string;
  }): Promise<number | null> {
    const [result] = await this.model.aggregate<{ totalTradeValue: number }>([
      {
        $match: {
          date: options.date,
          type: TickerType.Equity,
          market: options.market,
        },
      },
      {
        $lookup: {
          from: 'equities',
          let: { sym: '$symbol' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$symbol', '$$sym'] },
                    { $eq: ['$exchange', options.exchange] },
                  ],
                },
              },
            },
          ],
          as: 'equityInfo',
        },
      },
      { $unwind: '$equityInfo' },
      { $match: { 'equityInfo.industryCode': options.industryCode } },
      { $group: { _id: null, totalTradeValue: { $sum: { $ifNull: ['$tradeValue', 0] } } } },
      { $project: { _id: 0, totalTradeValue: 1 } },
    ]).exec();

    return result?.totalTradeValue ?? null;
  }

  async getMarketMap(options?: { date?: string; market?: 'TSE' | 'OTC' }): Promise<MarketMapResponse> {
    const requestedDate = options?.date ?? DateTime.local().toISODate();
    const market = options?.market === 'OTC' ? Market.OTC : Market.TSE;
    const responseMarket: 'TSE' | 'OTC' = options?.market === 'OTC' ? 'OTC' : 'TSE';
    const exchange = options?.market === 'OTC' ? Exchange.TPEx : Exchange.TWSE;

    const latestDate = await this.getLatestEquityDate(requestedDate, market);
    if (!latestDate) {
      return { date: requestedDate, market: responseMarket, sectors: [] };
    }

    const results = await this.model.aggregate([
      {
        $match: {
          date: latestDate,
          type: TickerType.Equity,
          market,
        },
      },
      {
        $lookup: {
          from: 'equities',
          let: { sym: '$symbol' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$symbol', '$$sym'] },
                    { $eq: ['$exchange', exchange] },
                  ],
                },
              },
            },
          ],
          as: 'equityInfo',
        },
      },
      {
        $unwind: { path: '$equityInfo', preserveNullAndEmptyArrays: true },
      },
      {
        // 排除未有 industryCode 的 ticker（ETF、ETN、權證等非普通股）
        $match: { 'equityInfo.industryCode': { $exists: true } },
      },
      {
        $addFields: {
          industryCode: { $ifNull: ['$equityInfo.industryCode', '00'] },
          tradeValueForMap: { $ifNull: ['$tradeValue', 0] },
          marketCap: {
            $cond: {
              if: {
                $and: [
                  { $gt: [{ $ifNull: ['$equityInfo.issuedShares', 0] }, 0] },
                  { $gt: [{ $ifNull: ['$closePrice', 0] }, 0] },
                ],
              },
              then: { $multiply: ['$equityInfo.issuedShares', '$closePrice'] },
              else: { $ifNull: ['$tradeValue', 0] },
            },
          },
        },
      },
      {
        $group: {
          _id: '$industryCode',
          totalMarketCap: { $sum: '$marketCap' },
          totalTradeValue: { $sum: '$tradeValueForMap' },
          stocks: {
            $push: {
              symbol: '$symbol',
              name: { $ifNull: ['$name', '$symbol'] },
              marketCap: '$marketCap',
              tradeValue: '$tradeValueForMap',
              changePercent: { $ifNull: ['$changePercent', 0] },
              openPrice: { $ifNull: ['$openPrice', 0] },
              highPrice: { $ifNull: ['$highPrice', 0] },
              lowPrice: { $ifNull: ['$lowPrice', 0] },
              closePrice: { $ifNull: ['$closePrice', 0] },
              tradeVolume: { $ifNull: ['$tradeVolume', 0] },
            },
          },
        },
      },
      { $sort: { totalMarketCap: -1 } },
    ]).exec();

    const sectors: MarketMapSector[] = results.map((doc: any) => ({
      industryCode: doc._id as string,
      name: getIndustryName(doc._id as string),
      totalMarketCap: doc.totalMarketCap as number,
      totalTradeValue: doc.totalTradeValue as number,
      stocks: doc.stocks as MarketMapItem[],
    }));

    return { date: latestDate, market: responseMarket, sectors };
  }
}
