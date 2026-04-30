import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MarketDataController } from './marketdata.controller';

describe('MarketDataController.getStockSummary', () => {
  it('returns stock summary from the ticker repository', async () => {
    const summary = { symbol: '2330', date: '2026-04-30' };
    const tickerRepository = { getStockSummary: vi.fn().mockResolvedValue(summary) };
    const controller = new MarketDataController({} as any, tickerRepository as any, {} as any);

    await expect(controller.getStockSummary({ symbol: '2330', date: '2026-04-30' })).resolves.toBe(summary);
    expect(tickerRepository.getStockSummary).toHaveBeenCalledWith({
      symbol: '2330',
      date: '2026-04-30',
    });
  });

  it('throws not found when stock summary is unavailable', async () => {
    const tickerRepository = { getStockSummary: vi.fn().mockResolvedValue(null) };
    const controller = new MarketDataController({} as any, tickerRepository as any, {} as any);

    await expect(controller.getStockSummary({ symbol: 'UNKNOWN' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
