import { describe, expect, it, vi } from 'vitest';
import { MarketResearchAgentTools } from './market-research-agent.tools';

describe('MarketResearchAgentTools', () => {
  const marketStatsRepository = {
    getMarketStats: vi.fn(),
  };
  const tickerRepository = {
    getSectorFlow: vi.fn(),
    getHotStocks: vi.fn(),
    getOhlcBySymbol: vi.fn(),
    getStockSummary: vi.fn(),
  };

  it('validates date ranges before querying repositories', async () => {
    const tools = new MarketResearchAgentTools(marketStatsRepository as any, tickerRepository as any)
      .createTools({ toolCalls: 0 }, { maxToolCalls: 8 });
    const marketStatsTool = tools.find(tool => tool.name === 'get_market_stats_range')!;

    const result = await marketStatsTool.handler({
      startDate: '2026-01-01',
      endDate: '2026-09-01',
    }, {} as any);

    expect(result).toMatchObject({
      resultType: 'failure',
    });
    expect(marketStatsRepository.getMarketStats).not.toHaveBeenCalled();
  });

  it('enforces the per-request tool call limit', async () => {
    marketStatsRepository.getMarketStats.mockResolvedValue([]);
    const state = { toolCalls: 0 };
    const tools = new MarketResearchAgentTools(marketStatsRepository as any, tickerRepository as any)
      .createTools(state, { maxToolCalls: 1 });
    const marketStatsTool = tools.find(tool => tool.name === 'get_market_stats_range')!;

    await marketStatsTool.handler({ startDate: '2026-01-01', endDate: '2026-01-02' }, {} as any);
    const result = await marketStatsTool.handler({ startDate: '2026-01-01', endDate: '2026-01-02' }, {} as any);

    expect(result).toMatchObject({
      resultType: 'failure',
    });
    expect(JSON.stringify(result)).toContain('Tool call limit exceeded');
  });

  it('returns empty barometer context when cached analysis is missing', async () => {
    marketStatsRepository.getMarketStats.mockResolvedValue([{ date: '2026-04-24' }]);
    const tools = new MarketResearchAgentTools(marketStatsRepository as any, tickerRepository as any)
      .createTools({ toolCalls: 0 }, { maxToolCalls: 8 });
    const barometerTool = tools.find(tool => tool.name === 'get_barometer')!;

    const result = await barometerTool.handler({ date: '2026-04-24' }, {} as any);

    expect(result).toMatchObject({
      resultType: 'success',
    });
    expect((result as any).textResultForLlm).toContain('"barometer":null');
  });

  it('emits sanitized tool status events', async () => {
    marketStatsRepository.getMarketStats.mockResolvedValue([]);
    const emit = vi.fn();
    const tools = new MarketResearchAgentTools(marketStatsRepository as any, tickerRepository as any)
      .createTools({ toolCalls: 0 }, { maxToolCalls: 8 }, emit);
    const marketStatsTool = tools.find(tool => tool.name === 'get_market_stats_range')!;

    await marketStatsTool.handler({ startDate: '2026-01-01', endDate: '2026-01-02' }, {} as any);

    expect(emit).toHaveBeenCalledWith({
      type: 'tool_start',
      toolName: 'get_market_stats_range',
      message: '正在查詢 get_market_stats_range',
    });
    expect(emit).toHaveBeenCalledWith({
      type: 'tool_result',
      toolName: 'get_market_stats_range',
      ok: true,
      message: 'get_market_stats_range 查詢完成',
    });
  });

  it('exposes a read-only stock summary tool', async () => {
    tickerRepository.getStockSummary.mockResolvedValue({
      symbol: '2330',
      date: '2026-04-24',
      quote: { closePrice: 900 },
    });
    const tools = new MarketResearchAgentTools(marketStatsRepository as any, tickerRepository as any)
      .createTools({ toolCalls: 0 }, { maxToolCalls: 8 });
    const stockSummaryTool = tools.find(tool => tool.name === 'get_stock_summary')!;

    const result = await stockSummaryTool.handler({ symbol: '2330', date: '2026-04-24' }, {} as any);

    expect(result).toMatchObject({ resultType: 'success' });
    expect(tickerRepository.getStockSummary).toHaveBeenCalledWith({ symbol: '2330', date: '2026-04-24' });
    expect((result as any).textResultForLlm).toContain('"symbol":"2330"');
  });
});
