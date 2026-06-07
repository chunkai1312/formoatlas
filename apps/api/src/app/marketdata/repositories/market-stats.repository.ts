import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MarketStats, MarketStatsDocument } from '../schemas/market-stats.schema';

const PROJECT_STAGE = { $project: { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 } };

@Injectable()
export class MarketStatsRepository {
  constructor(
    @InjectModel(MarketStats.name) private readonly model: Model<MarketStatsDocument>,
  ) {}

  async updateMarketStats(marketStats: Partial<MarketStats>) {
    const { date } = marketStats;
    return this.model.updateOne({ date }, marketStats, { upsert: true });
  }

  async getLatestTradingDate(before: string): Promise<{ date: string } | null> {
    const result = await this.model
      .findOne({ date: { $lte: before } })
      .sort({ date: -1 })
      .select({ date: 1, _id: 0 })
      .lean();
    return result ? { date: result.date } : null;
  }

  async getMarketStatsByDate(date: string): Promise<MarketStats | null> {
    return this.model
      .findOne({ date })
      .select({ _id: 0, __v: 0, createdAt: 0, updatedAt: 0 })
      .lean();
  }

  async getMarketStats(options?: { startDate?: string; endDate?: string }) {
    const { startDate, endDate } = options ?? {};

    const [rangeResults, [prevRecord]] = await Promise.all([
      this.model.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        PROJECT_STAGE,
        { $sort: { date: -1 } },
      ]),
      // 取 startDate 前一筆，用於計算範圍內最早一筆的變化值
      this.model.aggregate([
        { $match: { date: { $lt: startDate } } },
        PROJECT_STAGE,
        { $sort: { date: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const all = prevRecord ? [...rangeResults, prevRecord] : rangeResults;
    return this.computeChanges(all).slice(0, rangeResults.length).reverse();
  }

  private computeChanges(results: MarketStats[]) {
    return results.map((doc, i) => {
      const next = results[i + 1];
      const has = (prop: string) => doc[prop] != null && next?.[prop] != null;
      const data = doc as Record<string, any>;
      data.taiexChangePercent = has('taiexPrice')
        && Math.round((doc.taiexChange / (doc.taiexPrice - doc.taiexChange)) * 10000) / 100;
      data.finiTxfNetOiChange = has('finiTxfNetOi')
        && doc.finiTxfNetOi - next.finiTxfNetOi;
      data.finiTxoCallsNetOiValueChange = has('finiTxoCallsNetOiValue')
        && doc.finiTxoCallsNetOiValue - next.finiTxoCallsNetOiValue;
      data.finiTxoPutsNetOiValueChange = has('finiTxoPutsNetOiValue')
        && doc.finiTxoPutsNetOiValue - next.finiTxoPutsNetOiValue;
      data.finiTxoNetOiValue = doc.finiTxoCallsNetOiValue != null && doc.finiTxoPutsNetOiValue != null
        ? doc.finiTxoCallsNetOiValue - doc.finiTxoPutsNetOiValue
        : null;
      data.finiTxoNetOiValueChange = has('finiTxoCallsNetOiValue') && has('finiTxoPutsNetOiValue') && next
        ? (doc.finiTxoCallsNetOiValue - doc.finiTxoPutsNetOiValue) - (next.finiTxoCallsNetOiValue - next.finiTxoPutsNetOiValue)
        : null;
      data.topTenSpecificFrontMonthTxfNetOiChange = has('topTenSpecificFrontMonthTxfNetOi')
        && doc.topTenSpecificFrontMonthTxfNetOi - next.topTenSpecificFrontMonthTxfNetOi;
      data.topTenSpecificBackMonthsTxfNetOiChange = has('topTenSpecificBackMonthsTxfNetOi')
        && doc.topTenSpecificBackMonthsTxfNetOi - next.topTenSpecificBackMonthsTxfNetOi;
      data.retailMxfNetOiChange = has('retailMxfNetOi')
        && doc.retailMxfNetOi - next.retailMxfNetOi;
      data.retailTmfNetOiChange = has('retailTmfNetOi')
        && doc.retailTmfNetOi - next.retailTmfNetOi;
      data.usdtwdChange = has('usdtwd')
        && parseFloat((doc.usdtwd - next.usdtwd).toPrecision(12));
      return data;
    });
  }
}
