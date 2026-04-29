import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EquityDocument = HydratedDocument<Equity>;

@Schema({ timestamps: true })
export class Equity {
  @Prop({ required: true })
  symbol: string;

  @Prop({ required: true })
  exchange: string;

  @Prop()
  name?: string;

  @Prop()
  industryCode: string;

  @Prop()
  issuedShares?: number;
}

export const EquitySchema = SchemaFactory.createForClass(Equity);

EquitySchema.index({ symbol: 1, exchange: 1 }, { unique: true });
