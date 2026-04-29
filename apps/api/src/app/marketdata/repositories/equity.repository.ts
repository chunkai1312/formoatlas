import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Equity, EquityDocument } from '../schemas/equity.schema';
import { Exchange, Market } from '../enums';
import { TickerMetadata } from '../types/ticker-metadata.types';

@Injectable()
export class EquityRepository {
  constructor(
    @InjectModel(Equity.name) private readonly model: Model<EquityDocument>,
  ) {}

  async upsertEquity(equity: Partial<Equity>) {
    const { symbol, exchange, ...rest } = equity;
    return this.model.updateOne(
      { symbol, exchange },
      { $set: rest },
      { upsert: true },
    );
  }

  async findAllByExchange(exchange: string): Promise<Equity[]> {
    return this.model
      .find({ exchange })
      .select({ _id: 0, symbol: 1, exchange: 1, name: 1, industryCode: 1, issuedShares: 1 })
      .lean()
      .exec();
  }

  async getMetadataBySymbols(symbols: string[]): Promise<TickerMetadata[]> {
    const uniqueSymbols = [...new Set(symbols.map(symbol => symbol.trim().toUpperCase()).filter(Boolean))];
    if (!uniqueSymbols.length) return [];

    const docs = await this.model
      .find({
        symbol: { $in: uniqueSymbols },
        name: { $exists: true, $ne: '' },
      })
      .select({ _id: 0, symbol: 1, exchange: 1, name: 1 })
      .lean()
      .exec();

    return docs.map(doc => ({
      symbol: doc.symbol,
      name: doc.name ?? doc.symbol,
      market: doc.exchange === Exchange.TPEx ? Market.OTC : Market.TSE,
    }));
  }
}
