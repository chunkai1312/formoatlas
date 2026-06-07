import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MarketStatsService } from './market-stats.service';

describe('MarketStatsService.updateMarginMaintenanceRatio', () => {
  it('stores the calculated TWSE market margin maintenance ratio', async () => {
    const { service, marketStatsRepository, tickerRepository } = createService({
      marketStats: { date: '2026-06-05', marginBalance: 566_649_267 },
      financedMarketValue: {
        financedMarketValue: 1_127_500_163_620,
        eligibleCount: 1202,
        missingClosePriceCount: 4,
      },
    });

    await service.updateMarginMaintenanceRatio('2026-06-05');

    expect(marketStatsRepository.getMarketStatsByDate).toHaveBeenCalledWith('2026-06-05');
    expect(tickerRepository.getTwseFinancedMarketValue).toHaveBeenCalledWith('2026-06-05');
    expect(marketStatsRepository.updateMarketStats).toHaveBeenCalledWith({
      date: '2026-06-05',
      marginMaintenanceRatio: 1.9898,
    });
  });

  it('does not update when market margin balance is missing', async () => {
    const warnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => undefined);
    const { service, marketStatsRepository, tickerRepository } = createService({
      marketStats: { date: '2026-06-05', marginBalance: 0 },
    });

    await service.updateMarginMaintenanceRatio('2026-06-05');

    expect(tickerRepository.getTwseFinancedMarketValue).not.toHaveBeenCalled();
    expect(marketStatsRepository.updateMarketStats).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      '2026-06-05 大盤融資維持率: 缺少大盤融資金額餘額',
      MarketStatsService.name,
    );

    warnSpy.mockRestore();
  });

  it('does not update when there are no eligible ticker rows', async () => {
    const warnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => undefined);
    const { service, marketStatsRepository } = createService({
      marketStats: { date: '2026-06-05', marginBalance: 566_649_267 },
      financedMarketValue: {
        financedMarketValue: 0,
        eligibleCount: 0,
        missingClosePriceCount: 2,
      },
    });

    await service.updateMarginMaintenanceRatio('2026-06-05');

    expect(marketStatsRepository.updateMarketStats).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      '2026-06-05 大盤融資維持率: 無有效個股融資與收盤價資料',
      MarketStatsService.name,
    );

    warnSpy.mockRestore();
  });
});

function createService(options: {
  marketStats?: { date: string; marginBalance?: number | null } | null;
  financedMarketValue?: {
    financedMarketValue: number;
    eligibleCount: number;
    missingClosePriceCount: number;
  };
}) {
  const marketStatsRepository = {
    getMarketStatsByDate: vi.fn().mockResolvedValue(options.marketStats ?? null),
    updateMarketStats: vi.fn().mockResolvedValue(undefined),
  };
  const tickerRepository = {
    getTwseFinancedMarketValue: vi.fn().mockResolvedValue(
      options.financedMarketValue ?? {
        financedMarketValue: 0,
        eligibleCount: 0,
        missingClosePriceCount: 0,
      },
    ),
  };
  const service = new MarketStatsService({} as any, marketStatsRepository as any, tickerRepository as any);

  return { service, marketStatsRepository, tickerRepository };
}
