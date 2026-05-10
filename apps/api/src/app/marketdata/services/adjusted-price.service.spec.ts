import { describe, expect, it, vi } from 'vitest';
import { AdjustedPriceService } from './adjusted-price.service';

describe('AdjustedPriceService', () => {
  it('applies event factors to candles before the effective date only', async () => {
    const repository = {
      findBySymbolThroughDate: vi.fn().mockResolvedValue([
        { effectiveDate: '2026-07-01', factor: 0.9 },
      ]),
    };
    const service = new AdjustedPriceService(repository as any);

    const result = await service.adjustOhlc('2330', [
      candle('2026-06-30', 100),
      candle('2026-07-01', 100),
    ]);

    expect(result[0]).toMatchObject({ openPrice: 90, highPrice: 99, lowPrice: 81, closePrice: 94.5 });
    expect(result[1]).toMatchObject({ openPrice: 100, highPrice: 110, lowPrice: 90, closePrice: 105 });
  });

  it('multiplies same-day event factors and preserves volume/value fields', async () => {
    const repository = {
      findBySymbolThroughDate: vi.fn().mockResolvedValue([
        { effectiveDate: '2026-07-01', factor: 0.9 },
        { effectiveDate: '2026-07-01', factor: 0.8 },
      ]),
    };
    const service = new AdjustedPriceService(repository as any);

    const result = await service.adjustOhlc('2330', [candle('2026-06-30', 100)]);

    expect(result[0]).toMatchObject({
      openPrice: 72,
      closePrice: 75.6,
      tradeVolume: 1000,
      tradeValue: 100000,
      tradeWeight: 1.2,
    });
  });

  it('applies ETF split and reverse split event factors', async () => {
    const repository = {
      findBySymbolThroughDate: vi.fn().mockResolvedValue([
        { eventType: 'etfSplit', effectiveDate: '2026-07-01', factor: 0.5 },
        { eventType: 'etfReverseSplit', effectiveDate: '2026-08-01', factor: 2 },
      ]),
    };
    const service = new AdjustedPriceService(repository as any);

    const result = await service.adjustOhlc('0050', [
      candle('2026-06-30', 100),
      candle('2026-07-01', 100),
      candle('2026-08-01', 100),
    ]);

    expect(result[0]).toMatchObject({ openPrice: 100, closePrice: 105 });
    expect(result[1]).toMatchObject({ openPrice: 200, closePrice: 210 });
    expect(result[2]).toMatchObject({ openPrice: 100, closePrice: 105 });
  });

  it('returns raw rows when no adjustment events exist', async () => {
    const rows = [candle('2026-06-30', 100)];
    const service = new AdjustedPriceService({
      findBySymbolThroughDate: vi.fn().mockResolvedValue([]),
    } as any);

    await expect(service.adjustOhlc('IX0001', rows)).resolves.toBe(rows);
  });
});

function candle(date: string, openPrice: number) {
  return {
    date,
    openPrice,
    highPrice: openPrice + 10,
    lowPrice: openPrice - 10,
    closePrice: openPrice + 5,
    tradeVolume: 1000,
    tradeValue: 100000,
    tradeWeight: 1.2,
  };
}
