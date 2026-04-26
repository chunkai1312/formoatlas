import * as _ from 'lodash';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DateTime } from 'luxon';
import { Ticker, TickerDocument } from '../schemas/ticker.schema';
import { TickerType, Market, Index } from '../enums';
import { getSectorName } from '../utils';

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

  async getOhlcBySymbol(options: { symbol: string, startDate?: string, endDate?: string }) {
    const startDate = options.startDate ?? DateTime.local().minus({ months: 3 }).toISODate();
    const endDate = options.endDate ?? DateTime.local().toISODate();

    return this.model
      .find({ symbol: options.symbol, date: { $gte: startDate, $lte: endDate } })
      .select({ _id: 0, date: 1, openPrice: 1, highPrice: 1, lowPrice: 1, closePrice: 1, tradeValue: 1, tradeWeight: 1 })
      .sort({ date: 1 })
      .lean()
      .exec();
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

    return tickers.map(doc => {
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
      .filter((doc: any) => doc.symbol !== benchmarkSymbol)
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
}
