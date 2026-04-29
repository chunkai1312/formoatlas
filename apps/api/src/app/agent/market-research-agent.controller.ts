import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { MarketResearchQueryDto } from './dto/market-research-query.dto';
import { MarketResearchStreamEvent } from './market-research-agent.events';
import { MarketResearchAgentService } from './market-research-agent.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('agent')
@Controller('agent')
export class MarketResearchAgentController {
  constructor(private readonly agentService: MarketResearchAgentService) {}

  @ApiOperation({ summary: '互動式台股盤後研究助理' })
  @UseGuards(JwtAuthGuard)
  @Post('market-research')
  query(@Body() body: MarketResearchQueryDto) {
    return this.agentService.query(body);
  }

  @ApiOperation({ summary: '互動式台股盤後研究助理 streaming' })
  @UseGuards(JwtAuthGuard)
  @Post('market-research/stream')
  async queryStream(@Body() body: MarketResearchQueryDto, @Res() res: Response) {
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
      const answer = await this.agentService.query(body, writeEvent);
      writeEvent({ type: 'final', answer });
    } catch (error) {
      writeEvent({
        type: 'error',
        message: error?.response?.message ?? error?.message ?? '市場研究助理暫時無法使用，請稍後再試',
      });
    } finally {
      res.end();
    }
  }
}
