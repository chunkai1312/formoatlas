import { Body, Controller, Delete, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtPayload } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgentConversationService } from './agent-conversation.service';
import { CreateAgentConversationDto } from './dto/create-agent-conversation.dto';
import { MarketResearchQueryDto } from './dto/market-research-query.dto';
import { MarketResearchStreamEvent } from './market-research-agent.events';
import { MarketResearchAgentService } from './market-research-agent.service';

@ApiTags('agent')
@UseGuards(JwtAuthGuard)
@Controller('agent/conversations')
export class AgentConversationController {
  constructor(
    private readonly conversationService: AgentConversationService,
    private readonly agentService: MarketResearchAgentService,
  ) {}

  @ApiOperation({ summary: '取得使用者市場研究對話列表' })
  @Get()
  list(@Req() req: Request) {
    return this.conversationService.list(this.userId(req));
  }

  @ApiOperation({ summary: '建立市場研究對話' })
  @Post()
  create(@Req() req: Request, @Body() body: CreateAgentConversationDto) {
    return this.conversationService.create(this.userId(req), body);
  }

  @ApiOperation({ summary: '取得市場研究對話詳情' })
  @Get(':id')
  detail(@Req() req: Request, @Param('id') id: string) {
    return this.conversationService.detail(this.userId(req), id);
  }

  @ApiOperation({ summary: '刪除市場研究對話' })
  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string) {
    await this.conversationService.delete(this.userId(req), id);
    return { ok: true };
  }

  @ApiOperation({ summary: '市場研究對話 streaming query' })
  @Post(':id/messages/stream')
  async streamMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: MarketResearchQueryDto,
    @Res() res: Response,
  ) {
    const userId = this.userId(req);
    await this.conversationService.ensureOwned(userId, id);

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const writeEvent = (event: MarketResearchStreamEvent) => {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      writeEvent({ type: 'status', message: '市場研究助理已收到問題' });
      await this.conversationService.recordUserMessage(userId, id, body);
      const answer = await this.agentService.query(body, writeEvent);
      await this.conversationService.recordAssistantSuccess(userId, id, body, answer);
      writeEvent({ type: 'final', answer });
    } catch (error) {
      const message = error?.response?.message ?? error?.message ?? '市場研究助理暫時無法使用，請稍後再試';
      await this.conversationService.recordAssistantFailure(userId, id, body, Array.isArray(message) ? message.join('，') : message);
      writeEvent({ type: 'error', message: Array.isArray(message) ? message.join('，') : message });
    } finally {
      res.end();
    }
  }

  private userId(req: Request): string {
    return (req.user as JwtPayload).sub;
  }
}
