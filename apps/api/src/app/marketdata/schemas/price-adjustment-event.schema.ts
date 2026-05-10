import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type PriceAdjustmentEventDocument = HydratedDocument<PriceAdjustmentEvent>;

export type PriceAdjustmentEventType =
  | 'dividend'
  | 'capitalReduction'
  | 'faceValueChange'
  | 'etfSplit'
  | 'etfReverseSplit';

@Schema({ timestamps: true })
export class PriceAdjustmentEvent {
  @Prop({ required: true })
  symbol: string;

  @Prop({ required: true })
  exchange: string;

  @Prop({ required: true })
  market: string;

  @Prop({ required: true })
  eventType: PriceAdjustmentEventType;

  @Prop({ required: true })
  effectiveDate: string;

  @Prop({ required: true })
  previousClose: number;

  @Prop({ required: true })
  referencePrice: number;

  @Prop({ required: true })
  factor: number;

  @Prop()
  cashDividend?: number;

  @Prop()
  stockDividendShares?: number;

  @Prop()
  sharesPerThousand?: number;

  @Prop()
  refundPerShare?: number;

  @Prop()
  reason?: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  raw: Record<string, unknown>;
}

export const PriceAdjustmentEventSchema = SchemaFactory.createForClass(PriceAdjustmentEvent)
  .index({ symbol: 1, exchange: 1, eventType: 1, effectiveDate: 1 }, { unique: true })
  .index({ symbol: 1, effectiveDate: 1 })
  .index({ exchange: 1, effectiveDate: 1 });
