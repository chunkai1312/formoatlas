import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Exchange, Market } from '../enums';
import { PriceAdjustmentEventService } from './price-adjustment-event.service';

describe('PriceAdjustmentEventService', () => {
  let twstock: any;
  let repository: { upsertEvents: ReturnType<typeof vi.fn> };
  let service: PriceAdjustmentEventService;

  beforeEach(() => {
    twstock = {
      stocks: {
        dividends: vi.fn().mockResolvedValue([]),
        capitalReductions: vi.fn().mockResolvedValue([]),
        splits: vi.fn().mockResolvedValue([]),
        etfSplits: vi.fn().mockResolvedValue([]),
      },
    };
    repository = { upsertEvents: vi.fn().mockResolvedValue([]) };
    service = new PriceAdjustmentEventService(twstock, repository as any);
  });

  it('updates TWSE dividends and computes cash plus stock dividend factor', async () => {
    twstock.stocks.dividends.mockResolvedValue([{
      date: '2026-07-01',
      exchange: Exchange.TWSE,
      symbol: '0050',
      previousClose: 100,
      referencePrice: 95,
      cashDividend: 4,
      stockDividendShares: 100,
    }]);

    await service.updateTwseDividends('2026-07-01');

    expect(twstock.stocks.dividends).toHaveBeenCalledWith({
      startDate: '2026-07-01',
      endDate: '2026-07-01',
      exchange: 'TWSE',
    });
    expect(repository.upsertEvents).toHaveBeenCalledWith([
      expect.objectContaining({
        symbol: '0050',
        exchange: Exchange.TWSE,
        market: Market.TSE,
        eventType: 'dividend',
        effectiveDate: '2026-07-01',
        previousClose: 100,
        referencePrice: 95,
        cashDividend: 4,
        stockDividendShares: 100,
        factor: expect.closeTo((1 - 4 / 100) * (1 / 1.1), 10),
      }),
    ]);
  });

  it('updates TPEx capital reductions from resume date and reference price ratio', async () => {
    twstock.stocks.capitalReductions.mockResolvedValue([{
      resumeDate: '2026-08-01',
      exchange: Exchange.TPEx,
      symbol: '1234',
      previousClose: 50,
      referencePrice: 100,
      sharesPerThousand: 500,
      refundPerShare: 2,
      reason: '彌補虧損',
    }]);

    await service.updateTpexCapitalReductions('2026-08-01');

    expect(repository.upsertEvents).toHaveBeenCalledWith([
      expect.objectContaining({
        symbol: '1234',
        exchange: Exchange.TPEx,
        market: Market.OTC,
        eventType: 'capitalReduction',
        effectiveDate: '2026-08-01',
        factor: 2,
        sharesPerThousand: 500,
        refundPerShare: 2,
        reason: '彌補虧損',
      }),
    ]);
  });

  it('distinguishes ETF split and reverse split update methods', async () => {
    twstock.stocks.etfSplits.mockResolvedValue([{
      resumeDate: '2026-09-01',
      exchange: Exchange.TWSE,
      symbol: '00632R',
      previousClose: 10,
      referencePrice: 5,
    }]);

    await service.updateTwseEtfSplits('2026-09-01');
    await service.updateTwseEtfReverseSplits('2026-09-01');

    expect(twstock.stocks.etfSplits).toHaveBeenNthCalledWith(1, {
      startDate: '2026-09-01',
      endDate: '2026-09-01',
      exchange: 'TWSE',
      reverseSplit: false,
    });
    expect(twstock.stocks.etfSplits).toHaveBeenNthCalledWith(2, {
      startDate: '2026-09-01',
      endDate: '2026-09-01',
      exchange: 'TWSE',
      reverseSplit: true,
    });
    expect(repository.upsertEvents).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({ eventType: 'etfSplit' }),
    ]);
    expect(repository.upsertEvents).toHaveBeenNthCalledWith(2, [
      expect.objectContaining({ eventType: 'etfReverseSplit' }),
    ]);
  });

  it('filters invalid source rows before upsert', async () => {
    twstock.stocks.splits.mockResolvedValue([{
      resumeDate: '2026-08-01',
      exchange: Exchange.TWSE,
      symbol: '2330',
      previousClose: 100,
      referencePrice: null,
    }]);

    await service.updateTwseFaceValueChanges('2026-08-01');

    expect(repository.upsertEvents).toHaveBeenCalledWith([]);
  });
});
