import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { MarketResearchContextDto } from '../dto/market-research-query.dto';
import { MarketResearchAgentOutput } from '../market-research-agent.schema';

export type AgentMessageDocument = HydratedDocument<AgentMessage>;
export type AgentMessageRole = 'user' | 'assistant';
export type AgentMessageStatus = 'completed' | 'failed';

@Schema({ timestamps: true, collection: 'agent_messages' })
export class AgentMessage {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  conversationId: Types.ObjectId;

  @Prop({ required: true, enum: ['user', 'assistant'] })
  role: AgentMessageRole;

  @Prop({ required: true, enum: ['completed', 'failed'], default: 'completed' })
  status: AgentMessageStatus;

  @Prop({ trim: true, maxlength: 1000 })
  question?: string;

  @Prop({ type: Object })
  answer?: MarketResearchAgentOutput;

  @Prop({ required: true })
  date: string;

  @Prop({ type: Object })
  context?: MarketResearchContextDto;

  @Prop({ trim: true, maxlength: 300 })
  error?: string;

  @Prop({ type: Date })
  completedAt?: Date;
}

export const AgentMessageSchema = SchemaFactory.createForClass(AgentMessage);

AgentMessageSchema.index({ userId: 1, conversationId: 1, createdAt: 1 });
