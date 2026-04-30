import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { defineTool, Tool, ToolResultObject } from '@github/copilot-sdk';
import { MarketStatsRepository } from '../marketdata/repositories/market-stats.repository';
import { TickerRepository } from '../marketdata/repositories/ticker.repository';
import { MarketResearchEventEmitter } from './market-research-agent.events';

const MAX_RANGE_DAYS = 180;
const TOOL_RESULT_LIMIT = 20_000;

type Market = 'TSE' | 'OTC';

interface ToolRuntimePolicy {
  maxToolCalls: number;
}

interface ToolRuntimeState {
  toolCalls: number;
}

function successResult(data: unknown): ToolResultObject {
  const text = JSON.stringify(data);
  return {
    resultType: 'success',
    textResultForLlm: text.length > TOOL_RESULT_LIMIT
      ? `${text.slice(0, TOOL_RESULT_LIMIT)}\n...TRUNCATED...`
      : text,
  };
}

function failureResult(message: string): ToolResultObject {
  return {
    resultType: 'failure',
    error: message,
    textResultForLlm: JSON.stringify({ error: message }),
  };
}

function parseMarket(value: unknown): Market {
  return value === 'OTC' ? 'OTC' : 'TSE';
}

function requireDate(value: unknown, field: string): string {
  if (typeof value !== 'string' || !DateTime.fromISO(value).isValid) {
    throw new BadRequestException(`${field} must be a valid ISO date`);
  }
  return value;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${field} is required`);
  }
  return value.trim();
}

function assertBoundedRange(startDate: string, endDate: string) {
  const start = DateTime.fromISO(startDate);
  const end = DateTime.fromISO(endDate);
  const days = end.diff(start, 'days').days;
  if (days < 0) {
    throw new BadRequestException('startDate must be before or equal to endDate');
  }
  if (days > MAX_RANGE_DAYS) {
    throw new BadRequestException(`date range must not exceed ${MAX_RANGE_DAYS} days`);
  }
}

@Injectable()
export class MarketResearchAgentTools {
  constructor(
    private readonly marketStatsRepository: MarketStatsRepository,
    private readonly tickerRepository: TickerRepository,
  ) {}

  createTools(state: ToolRuntimeState, policy: ToolRuntimePolicy, emit?: MarketResearchEventEmitter): Tool[] {
    return [
      defineTool('get_market_stats_range', {
        description: 'Read FormoAtlas daily market breadth, institutional, futures, options, margin, FX, and cached barometer fields for a bounded date range.',
        parameters: {
          type: 'object',
          properties: {
            startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format.' },
            endDate: { type: 'string', description: 'End date in YYYY-MM-DD format.' },
          },
          required: ['startDate', 'endDate'],
        },
        skipPermission: true,
        handler: async (args) => this.runTool('get_market_stats_range', state, policy, emit, async () => {
          const input = args as Record<string, unknown>;
          const startDate = requireDate(input['startDate'], 'startDate');
          const endDate = requireDate(input['endDate'], 'endDate');
          assertBoundedRange(startDate, endDate);
          return successResult(await this.marketStatsRepository.getMarketStats({ startDate, endDate }));
        }),
      }),
      defineTool('get_barometer', {
        description: 'Read cached daily FormoAtlas barometer analysis from market stats for one date. Does not generate new barometer output.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
          },
          required: ['date'],
        },
        skipPermission: true,
        handler: async (args) => this.runTool('get_barometer', state, policy, emit, async () => {
          const input = args as Record<string, unknown>;
          const date = requireDate(input['date'], 'date');
          const [stats] = await this.marketStatsRepository.getMarketStats({ startDate: date, endDate: date });
          return successResult({
            date,
            barometer: stats?.aiAnalysis ?? null,
            hasMarketStats: !!stats,
          });
        }),
      }),
      defineTool('get_sector_flow', {
        description: 'Read FormoAtlas sector money flow ranking for TSE or OTC on one date.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
            market: { type: 'string', enum: ['TSE', 'OTC'], description: 'Market, either TSE or OTC.' },
          },
          required: ['date', 'market'],
        },
        skipPermission: true,
        handler: async (args) => this.runTool('get_sector_flow', state, policy, emit, async () => {
          const input = args as Record<string, unknown>;
          const date = requireDate(input['date'], 'date');
          const market = parseMarket(input['market']);
          return successResult(await this.tickerRepository.getSectorFlow({ date, market }));
        }),
      }),
      defineTool('get_hot_stocks', {
        description: 'Read FormoAtlas hot stock rankings for TSE or OTC on one date, including movers, actives, and institutional buy/sell rankings.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
            market: { type: 'string', enum: ['TSE', 'OTC'], description: 'Market, either TSE or OTC.' },
          },
          required: ['date', 'market'],
        },
        skipPermission: true,
        handler: async (args) => this.runTool('get_hot_stocks', state, policy, emit, async () => {
          const input = args as Record<string, unknown>;
          const date = requireDate(input['date'], 'date');
          const market = parseMarket(input['market']);
          return successResult(await this.tickerRepository.getHotStocks({ date, market }));
        }),
      }),
      defineTool('get_ticker_ohlc', {
        description: 'Read FormoAtlas OHLC history for one ticker or index symbol over a bounded date range.',
        parameters: {
          type: 'object',
          properties: {
            symbol: { type: 'string', description: 'Ticker or index symbol.' },
            startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format.' },
            endDate: { type: 'string', description: 'End date in YYYY-MM-DD format.' },
          },
          required: ['symbol', 'startDate', 'endDate'],
        },
        skipPermission: true,
        handler: async (args) => this.runTool('get_ticker_ohlc', state, policy, emit, async () => {
          const input = args as Record<string, unknown>;
          const symbol = requireString(input['symbol'], 'symbol');
          const startDate = requireDate(input['startDate'], 'startDate');
          const endDate = requireDate(input['endDate'], 'endDate');
          assertBoundedRange(startDate, endDate);
          return successResult(await this.tickerRepository.getOhlcBySymbol({ symbol, startDate, endDate }));
        }),
      }),
      defineTool('get_stock_summary', {
        description: 'Read FormoAtlas stock summary for one equity symbol on one date, including quote, recent OHLC, institutional flow, industry metadata, and lightweight market context.',
        parameters: {
          type: 'object',
          properties: {
            symbol: { type: 'string', description: 'Equity ticker symbol.' },
            date: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
          },
          required: ['symbol', 'date'],
        },
        skipPermission: true,
        handler: async (args) => this.runTool('get_stock_summary', state, policy, emit, async () => {
          const input = args as Record<string, unknown>;
          const symbol = requireString(input['symbol'], 'symbol');
          const date = requireDate(input['date'], 'date');
          const result = await this.tickerRepository.getStockSummary({ symbol, date });
          if (!result) {
            return failureResult(`No stock summary found for ${symbol} on or before ${date}`);
          }
          return successResult(result);
        }),
      }),
    ];
  }

  private async runTool(
    toolName: string,
    state: ToolRuntimeState,
    policy: ToolRuntimePolicy,
    emit: MarketResearchEventEmitter | undefined,
    handler: () => Promise<ToolResultObject>,
  ): Promise<ToolResultObject> {
    state.toolCalls += 1;
    if (state.toolCalls > policy.maxToolCalls) {
      const message = `Tool call limit exceeded (${policy.maxToolCalls})`;
      emit?.({ type: 'tool_result', toolName, ok: false, message });
      return failureResult(message);
    }

    emit?.({ type: 'tool_start', toolName, message: `正在查詢 ${toolName}` });

    try {
      const result = await handler();
      emit?.({ type: 'tool_result', toolName, ok: result.resultType === 'success', message: `${toolName} 查詢完成` });
      return result;
    } catch (error) {
      const message = error?.message ?? 'Tool execution failed';
      emit?.({ type: 'tool_result', toolName, ok: false, message });
      return failureResult(message);
    }
  }
}
