import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PriceAdjustmentEvent,
  PriceAdjustmentEventDocument,
} from '../schemas/price-adjustment-event.schema';

@Injectable()
export class PriceAdjustmentEventRepository {
  constructor(
    @InjectModel(PriceAdjustmentEvent.name)
    private readonly model: Model<PriceAdjustmentEventDocument>,
  ) {}

  async upsertEvent(event: PriceAdjustmentEvent) {
    const { symbol, exchange, eventType, effectiveDate } = event;
    return this.model.updateOne(
      { symbol, exchange, eventType, effectiveDate },
      { $set: event },
      { upsert: true },
    );
  }

  async upsertEvents(events: PriceAdjustmentEvent[]) {
    if (!events.length) return [];
    return Promise.all(events.map(event => this.upsertEvent(event)));
  }

  async findBySymbolThroughDate(symbol: string, endDate: string): Promise<PriceAdjustmentEvent[]> {
    return this.model
      .find({
        symbol: symbol.trim().toUpperCase(),
        effectiveDate: { $lte: endDate },
      })
      .select({ _id: 0, __v: 0, createdAt: 0, updatedAt: 0 })
      .sort({ effectiveDate: 1, eventType: 1 })
      .lean()
      .exec();
  }
}
