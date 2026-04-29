import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { MarketResearchContextDto } from '../dto/market-research-query.dto';

export type AgentConversationDocument = HydratedDocument<AgentConversation>;

@Schema({ timestamps: true, collection: 'agent_conversations' })
export class AgentConversation {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  copilotSessionId: string;

  @Prop({ required: true, trim: true, maxlength: 80, default: '新對話' })
  title: string;

  @Prop({ type: Object })
  contextSnapshot?: MarketResearchContextDto;

  @Prop({ required: true, default: 0, min: 0 })
  messageCount: number;

  @Prop({ type: Date, required: true, default: Date.now, index: true })
  lastMessageAt: Date;

  @Prop({ type: Date })
  archivedAt?: Date;
}

export const AgentConversationSchema = SchemaFactory.createForClass(AgentConversation);

AgentConversationSchema.index({ userId: 1, lastMessageAt: -1 });
AgentConversationSchema.index({ copilotSessionId: 1 }, { unique: true, sparse: true });
