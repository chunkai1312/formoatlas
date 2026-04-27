import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Equity, EquityDocument } from '../schemas/equity.schema';

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
      .select({ _id: 0, symbol: 1, exchange: 1, industryCode: 1, issuedShares: 1 })
      .lean()
      .exec();
  }
}
