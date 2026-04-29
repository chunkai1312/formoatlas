import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TickerDocument = HydratedDocument<Ticker>;

@Schema({ _id: false })
export class InstitutionalTrade {
  @Prop()
  buy: number;

  @Prop()
  sell: number;

  @Prop()
  net: number;

  @Prop()
  consecutiveDays?: number;
}

@Schema({ _id: false })
export class InstInvestors {
  @Prop({ type: InstitutionalTrade })
  fini: InstitutionalTrade;

  @Prop({ type: InstitutionalTrade })
  sitc: InstitutionalTrade;

  @Prop({ type: InstitutionalTrade })
  dealers: InstitutionalTrade;
}

@Schema({ timestamps: true })
export class Ticker {
  @Prop({ required: true })
  date: string;

  @Prop()
  type: string;

  @Prop()
  exchange: string;

  @Prop()
  market: string;

  @Prop()
  symbol: string;

  @Prop()
  name: string;

  @Prop()
  openPrice: number;

  @Prop()
  highPrice: number;

  @Prop()
  lowPrice: number;

  @Prop()
  closePrice: number;

  @Prop()
  change: number;

  @Prop()
  changePercent: number;

  @Prop()
  tradeVolume: number;

  @Prop()
  tradeValue: number;

  @Prop()
  transaction: number;

  @Prop()
  tradeWeight: number;

  @Prop({ type: InstInvestors })
  instInvestors?: InstInvestors;
}

export const TickerSchema = SchemaFactory.createForClass(Ticker)
  .index({ date: -1, symbol: 1 }, { unique: true })
  .index({ type: 1, market: 1, date: -1 })
  .index({ type: 1, symbol: 1, date: -1 });
