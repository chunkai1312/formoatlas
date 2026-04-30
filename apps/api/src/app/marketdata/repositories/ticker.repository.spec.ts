import { describe, expect, it, vi } from 'vitest';

vi.mock('../schemas/ticker.schema', () => ({
  Ticker: { name: 'Ticker' },
}));

import { TickerRepository } from './ticker.repository';

describe('TickerRepository.getMarketMap', () => {
  it('includes tradeValue in stock rows and totalTradeValue in sectors', async () => {
    let capturedPipeline: any[] = [];
    const model = {
      aggregate: vi.fn((pipeline: any[]) => {
        capturedPipeline = pipeline;
        return {
          exec: vi.fn().mockResolvedValue([
            {
              _id: '24',
              totalMarketCap: 1_000_000_000,
              totalTradeValue: 25_000_000,
              stocks: [
                {
                  symbol: '2330',
                  name: '台積電',
                  marketCap: 1_000_000_000,
                  tradeValue: 25_000_000,
                  changePercent: 1.23,
                  openPrice: 900,
                  highPrice: 920,
                  lowPrice: 895,
                  closePrice: 910,
                  tradeVolume: 12000,
                },
              ],
            },
          ]),
        };
      }),
    };
    const repository = new TickerRepository(model as any);
    vi.spyOn(repository as any, 'getLatestEquityDate').mockResolvedValue('2026-04-24');

    const result = await repository.getMarketMap({ date: '2026-04-24', market: 'TSE' });

    expect(result.sectors[0].totalTradeValue).toBe(25_000_000);
    expect(result.sectors[0].stocks[0].tradeValue).toBe(25_000_000);

    const addFields = capturedPipeline.find(stage => stage.$addFields)?.$addFields;
    const group = capturedPipeline.find(stage => stage.$group)?.$group;
    expect(addFields.tradeValueForMap).toEqual({ $ifNull: ['$tradeValue', 0] });
    expect(group.totalTradeValue).toEqual({ $sum: '$tradeValueForMap' });
    expect(group.stocks.$push.tradeValue).toBe('$tradeValueForMap');
  });

  it('returns an empty response when no latest equity date exists', async () => {
    const model = {
      aggregate: vi.fn(),
    };
    const repository = new TickerRepository(model as any);
    vi.spyOn(repository as any, 'getLatestEquityDate').mockResolvedValue(null);

    await expect(repository.getMarketMap({ date: '2026-04-24', market: 'OTC' })).resolves.toEqual({
      date: '2026-04-24',
      market: 'OTC',
      sectors: [],
    });
    expect(model.aggregate).not.toHaveBeenCalled();
  });
});

describe('TickerRepository.getStockSummary', () => {
  it('returns stock summary using the latest row on or before the requested date', async () => {
    const model = createAggregateModel([
      [tickerRow({ date: '2026-04-29' })],
      [{ totalTradeValue: 100_000_000 }],
    ]);
    const repository = new TickerRepository(model as any);
    vi.spyOn(repository, 'getOhlcBySymbol').mockResolvedValue([
      { date: '2026-04-28', openPrice: 900, highPrice: 910, lowPrice: 890, closePrice: 905, tradeVolume: 1000, tradeValue: 10_000_000 },
      { date: '2026-04-29', openPrice: 905, highPrice: 920, lowPrice: 902, closePrice: 918, tradeVolume: 1200, tradeValue: 12_000_000 },
    ] as any);
    vi.spyOn(repository, 'getHotStocks').mockResolvedValue({
      date: '2026-04-29',
      market: 'TSE',
      movers: { gainers: [{ symbol: '2330' } as any], losers: [] },
      actives: { byVolume: [], byValue: [{ symbol: '1101' } as any, { symbol: '2330' } as any] },
      institutional: { finiBuy: [], finiSell: [], sitcBuy: [{ symbol: '2330' } as any], sitcSell: [] },
    });

    const result = await repository.getStockSummary({ symbol: '2330', date: '2026-04-30' });

    expect(result).toMatchObject({
      requestedDate: '2026-04-30',
      date: '2026-04-29',
      symbol: '2330',
      name: '台積電',
      market: 'TSE',
      industryCode: '24',
      industryName: expect.any(String),
      quote: {
        closePrice: 918,
        tradeValue: 12_000_000,
      },
      institutional: {
        finiNet: 1000,
        sitcNet: 200,
        dealersNet: -50,
        finiConsecutiveDays: 3,
        sitcConsecutiveDays: 2,
      },
      context: {
        appearsInHotStocks: true,
        hotStockLists: ['movers.gainers', 'actives.byValue', 'institutional.sitcBuy'],
        hotStockRanks: [
          { key: 'movers.gainers', label: '漲幅榜', rank: 1, tone: 'positive' },
          { key: 'actives.byValue', label: '成交金額排行', rank: 2, tone: 'neutral' },
          { key: 'institutional.sitcBuy', label: '投信買超', rank: 1, tone: 'positive' },
        ],
        marketCap: 918_000_000,
        sectorTradeValue: 100_000_000,
        sectorWeightByTradeValue: 0.12,
      },
    });
    expect(result?.ohlc).toHaveLength(2);
    expect(repository.getOhlcBySymbol).toHaveBeenCalledWith({
      symbol: '2330',
      startDate: '2021-04-29',
      endDate: '2026-04-29',
    });
  });

  it('returns null when no ticker row exists for the symbol', async () => {
    const model = createAggregateModel([[]]);
    const repository = new TickerRepository(model as any);

    await expect(repository.getStockSummary({ symbol: 'UNKNOWN', date: '2026-04-30' })).resolves.toBeNull();
  });

  it('keeps optional institutional and market-cap fields nullable', async () => {
    const model = createAggregateModel([
      [tickerRow({
        instInvestors: undefined,
        equityInfo: { symbol: '2330', exchange: 'TWSE', name: '台積電', industryCode: '24' },
      })],
      [],
    ]);
    const repository = new TickerRepository(model as any);
    vi.spyOn(repository, 'getOhlcBySymbol').mockResolvedValue([] as any);
    vi.spyOn(repository, 'getHotStocks').mockResolvedValue({
      date: '2026-04-30',
      market: 'TSE',
      movers: { gainers: [], losers: [] },
      actives: { byVolume: [], byValue: [] },
      institutional: { finiBuy: [], finiSell: [], sitcBuy: [], sitcSell: [] },
    });

    const result = await repository.getStockSummary({ symbol: '2330', date: '2026-04-30' });

    expect(result?.institutional).toEqual({
      finiNet: null,
      sitcNet: null,
      dealersNet: null,
      finiConsecutiveDays: null,
      sitcConsecutiveDays: null,
    });
    expect(result?.context.marketCap).toBeNull();
    expect(result?.context.appearsInHotStocks).toBe(false);
  });
});

function createAggregateModel(results: any[][]) {
  return {
    aggregate: vi.fn(() => ({
      exec: vi.fn().mockResolvedValue(results.shift() ?? []),
    })),
  };
}

function tickerRow(overrides: Record<string, any> = {}) {
  return {
    date: '2026-04-30',
    type: 'EQUITY',
    exchange: 'TWSE',
    market: 'TSE',
    symbol: '2330',
    name: '台積電',
    openPrice: 905,
    highPrice: 920,
    lowPrice: 902,
    closePrice: 918,
    change: 10,
    changePercent: 1.1,
    tradeVolume: 1200,
    tradeValue: 12_000_000,
    transaction: 3000,
    instInvestors: {
      fini: { net: 1000, consecutiveDays: 3 },
      sitc: { net: 200, consecutiveDays: 2 },
      dealers: { net: -50 },
    },
    equityInfo: {
      symbol: '2330',
      exchange: 'TWSE',
      name: '台積電',
      industryCode: '24',
      issuedShares: 1_000_000,
    },
    ...overrides,
  };
}
