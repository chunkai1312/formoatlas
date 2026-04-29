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
