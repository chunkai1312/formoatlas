import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateAgentConversationDto } from './dto/create-agent-conversation.dto';
import { MarketResearchQueryDto } from './dto/market-research-query.dto';
import { MarketResearchAgentOutput } from './market-research-agent.schema';
import { AgentConversation, AgentConversationDocument } from './schemas/agent-conversation.schema';
import { AgentMessage, AgentMessageDocument } from './schemas/agent-message.schema';
import { AgentConversationDetail, AgentConversationMessage, AgentConversationSummary } from './agent-conversation.types';

@Injectable()
export class AgentConversationService {
  constructor(
    @InjectModel(AgentConversation.name) private readonly conversationModel: Model<AgentConversationDocument>,
    @InjectModel(AgentMessage.name) private readonly messageModel: Model<AgentMessageDocument>,
  ) {}

  async create(userId: string, input: CreateAgentConversationDto = {}): Promise<AgentConversationSummary> {
    const now = new Date();
    const userObjectId = this.toObjectId(userId);
    const conversationObjectId = new Types.ObjectId();
    const conversation = await this.conversationModel.create({
      _id: conversationObjectId,
      userId: userObjectId,
      copilotSessionId: this.buildCopilotSessionId(userObjectId, conversationObjectId),
      title: this.normalizeTitle(input.title) ?? '新對話',
      contextSnapshot: input.context,
      messageCount: 0,
      lastMessageAt: now,
    });

    return this.toSummary(conversation);
  }

  async list(userId: string): Promise<AgentConversationSummary[]> {
    const conversations = await this.conversationModel
      .find({ userId: this.toObjectId(userId), archivedAt: { $exists: false } })
      .sort({ lastMessageAt: -1 })
      .lean();

    return conversations.map(conversation => this.toSummary(conversation));
  }

  async detail(userId: string, conversationId: string): Promise<AgentConversationDetail> {
    const conversation = await this.findOwnedConversation(userId, conversationId);
    const messages = await this.messageModel
      .find({ userId: this.toObjectId(userId), conversationId: this.toObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .lean();

    return {
      ...this.toSummary(conversation),
      messages: messages.map(message => this.toMessage(message)),
    };
  }

  async delete(userId: string, conversationId: string): Promise<void> {
    await this.findOwnedConversation(userId, conversationId);
    const query = { userId: this.toObjectId(userId), conversationId: this.toObjectId(conversationId) };
    await this.messageModel.deleteMany(query);
    await this.conversationModel.deleteOne({ _id: this.toObjectId(conversationId), userId: this.toObjectId(userId) });
  }

  async ensureOwned(userId: string, conversationId: string): Promise<void> {
    await this.findOwnedConversation(userId, conversationId);
  }

  async recordUserMessage(userId: string, conversationId: string, input: MarketResearchQueryDto): Promise<AgentConversationMessage> {
    await this.findOwnedConversation(userId, conversationId);
    const userObjectId = this.toObjectId(userId);
    const conversationObjectId = this.toObjectId(conversationId);
    const message = await this.messageModel.create({
      userId: userObjectId,
      conversationId: conversationObjectId,
      role: 'user',
      status: 'completed',
      question: input.question,
      date: input.date,
      context: input.context,
      completedAt: new Date(),
    });

    await this.touchConversation(userObjectId, conversationObjectId, 1, {
      title: this.generateTitle(input.question),
      contextSnapshot: input.context,
    });

    return this.toMessage(message);
  }

  async recordAssistantSuccess(
    userId: string,
    conversationId: string,
    input: MarketResearchQueryDto,
    answer: MarketResearchAgentOutput,
  ): Promise<AgentConversationMessage> {
    const message = await this.messageModel.create({
      userId: this.toObjectId(userId),
      conversationId: this.toObjectId(conversationId),
      role: 'assistant',
      status: 'completed',
      answer,
      date: input.date,
      context: input.context,
      completedAt: new Date(),
    });

    await this.touchConversation(this.toObjectId(userId), this.toObjectId(conversationId), 1);
    return this.toMessage(message);
  }

  async recordAssistantFailure(
    userId: string,
    conversationId: string,
    input: MarketResearchQueryDto,
    error: string,
  ): Promise<AgentConversationMessage> {
    const message = await this.messageModel.create({
      userId: this.toObjectId(userId),
      conversationId: this.toObjectId(conversationId),
      role: 'assistant',
      status: 'failed',
      error: this.truncate(error, 300),
      date: input.date,
      context: input.context,
      completedAt: new Date(),
    });

    await this.touchConversation(this.toObjectId(userId), this.toObjectId(conversationId), 1);
    return this.toMessage(message);
  }

  private async findOwnedConversation(userId: string, conversationId: string) {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(conversationId)) {
      throw new NotFoundException('Conversation not found');
    }

    const conversation = await this.conversationModel.findOne({
      _id: this.toObjectId(conversationId),
      userId: this.toObjectId(userId),
      archivedAt: { $exists: false },
    }).lean();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  private async touchConversation(
    userId: Types.ObjectId,
    conversationId: Types.ObjectId,
    messageIncrement: number,
    defaults?: { title?: string; contextSnapshot?: MarketResearchQueryDto['context'] },
  ) {
    const conversation = await this.conversationModel.findOne({ _id: conversationId, userId }).lean();
    const update: Record<string, unknown> = {
      $set: { lastMessageAt: new Date() },
      $inc: { messageCount: messageIncrement },
    };

    if (conversation && (!conversation.title || conversation.title === '新對話') && defaults?.title) {
      update.$set = {
        ...(update.$set as Record<string, unknown>),
        title: defaults.title,
      };
    }

    if (conversation && !conversation.contextSnapshot && defaults?.contextSnapshot) {
      update.$set = {
        ...(update.$set as Record<string, unknown>),
        contextSnapshot: defaults.contextSnapshot,
      };
    }

    await this.conversationModel.updateOne({ _id: conversationId, userId }, update);
  }

  private toObjectId(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new NotFoundException('Conversation not found');
    }
    return new Types.ObjectId(value);
  }

  private normalizeTitle(title?: string): string | null {
    const normalized = title?.trim();
    return normalized ? this.truncate(normalized, 80) : null;
  }

  private generateTitle(question: string): string {
    return this.truncate(question.trim().replace(/\s+/g, ' '), 40) || '新對話';
  }

  private buildCopilotSessionId(userId: Types.ObjectId, conversationId: Types.ObjectId): string {
    return `formoatlas:user:${userId.toString()}:conversation:${conversationId.toString()}`;
  }

  private truncate(value: string, maxLength: number): string {
    return value.length > maxLength ? value.slice(0, maxLength) : value;
  }

  private toSummary(conversation: any): AgentConversationSummary {
    return {
      id: conversation._id.toString(),
      title: conversation.title,
      messageCount: conversation.messageCount ?? 0,
      lastMessageAt: this.toIso(conversation.lastMessageAt ?? conversation.updatedAt ?? conversation.createdAt),
      contextSnapshot: conversation.contextSnapshot,
    };
  }

  private toMessage(message: any): AgentConversationMessage {
    return {
      id: message._id.toString(),
      role: message.role,
      status: message.status,
      question: message.question,
      answer: message.answer,
      date: message.date,
      context: message.context,
      error: message.error,
      createdAt: this.toIso(message.createdAt),
      completedAt: message.completedAt ? this.toIso(message.completedAt) : undefined,
    };
  }

  private toIso(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
