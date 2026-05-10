import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MarketDataController } from './marketdata.controller';

describe('MarketDataController.getStockSummary', () => {
  it('returns stock summary from the ticker repository', async () => {
    const summary = { symbol: '2330', date: '2026-04-30' };
    const tickerRepository = { getStockSummary: vi.fn().mockResolvedValue(summary) };
    const controller = new MarketDataController({} as any, tickerRepository as any, {} as any, {} as any);

    await expect(controller.getStockSummary({ symbol: '2330', date: '2026-04-30' })).resolves.toBe(summary);
    expect(tickerRepository.getStockSummary).toHaveBeenCalledWith({
      symbol: '2330',
      date: '2026-04-30',
    });
  });

  it('throws not found when stock summary is unavailable', async () => {
    const tickerRepository = { getStockSummary: vi.fn().mockResolvedValue(null) };
    const controller = new MarketDataController({} as any, tickerRepository as any, {} as any, {} as any);

    await expect(controller.getStockSummary({ symbol: 'UNKNOWN' })).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('MarketDataController.getTickers', () => {
  it('returns raw OHLC when adjusted is omitted', async () => {
    const rows = [{ date: '2026-01-01', closePrice: 100 }];
    const tickerRepository = { getOhlcBySymbol: vi.fn().mockResolvedValue(rows) };
    const adjustedPriceService = { adjustOhlc: vi.fn() };
    const controller = new MarketDataController({} as any, tickerRepository as any, {} as any, adjustedPriceService as any);

    await expect(controller.getTickers({ symbol: '2330' })).resolves.toBe(rows);
    expect(tickerRepository.getOhlcBySymbol).toHaveBeenCalledWith({
      symbol: '2330',
      startDate: undefined,
      endDate: undefined,
    });
    expect(adjustedPriceService.adjustOhlc).not.toHaveBeenCalled();
  });

  it('returns adjusted OHLC when adjusted is true', async () => {
    const rawRows = [{ date: '2026-01-01', closePrice: 100 }];
    const adjustedRows = [{ date: '2026-01-01', closePrice: 90 }];
    const tickerRepository = { getOhlcBySymbol: vi.fn().mockResolvedValue(rawRows) };
    const adjustedPriceService = { adjustOhlc: vi.fn().mockResolvedValue(adjustedRows) };
    const controller = new MarketDataController({} as any, tickerRepository as any, {} as any, adjustedPriceService as any);

    await expect(controller.getTickers({ symbol: '2330', adjusted: true })).resolves.toBe(adjustedRows);
    expect(adjustedPriceService.adjustOhlc).toHaveBeenCalledWith('2330', rawRows);
  });
});
