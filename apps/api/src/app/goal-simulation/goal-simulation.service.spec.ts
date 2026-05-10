import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DateTime } from 'luxon';
import { describe, expect, it, vi } from 'vitest';
import { RunGoalSimulationDto } from './dto/run-goal-simulation.dto';
import { GoalSimulationService } from './goal-simulation.service';

describe('GoalSimulationService', () => {
  it('runs buy-and-hold only and returns goal metrics', async () => {
    const repository = { getOhlcBySymbol: vi.fn().mockResolvedValue(sampleOhlc()) };
    const adjustedPriceService = { adjustOhlc: vi.fn().mockResolvedValue(sampleOhlc()) };
    const service = new GoalSimulationService(repository as any, adjustedPriceService as any);

    const result = await service.run({
      targetAmount: 1_500_000,
      horizonYears: 1,
      startDate: '2025-01-01',
      endDate: '2025-03-31',
      initialCapital: 1_000_000,
      monthlyContribution: 10_000,
      maxDrawdownTolerancePct: 20,
      universe: { type: 'single-symbol', symbols: ['2330'] },
    });

    expect(repository.getOhlcBySymbol).toHaveBeenCalledWith({
      symbol: '2330',
      startDate: '2025-01-01',
      endDate: '2025-03-31',
    });
    expect(adjustedPriceService.adjustOhlc).toHaveBeenCalledWith('2330', sampleOhlc());
    expect(result.universe.symbols).toEqual(['2330']);
    expect(result.requestedRange).toEqual({ startDate: '2025-01-01', endDate: '2025-03-31' });
    expect(result.target).toMatchObject({ targetAmount: 1_500_000, source: 'targetAmount' });
    expect(result.costAssumption).toMatchObject({ mode: 'ignored', feeRate: null, taxRate: null });
    expect(result.warnings.join(' ')).toContain('還原 OHLC');
    expect(result.warnings.join(' ')).toContain('未扣交易成本');
    expect(result.cashflow.contributionEvents).toBeGreaterThan(0);
    expect(result.candidates.map(candidate => candidate.strategy)).toEqual(['buy-and-hold']);
    for (const candidate of result.candidates) {
      expect(candidate.status).toBe('available');
      expect(candidate.projectedFinalValue).toBeGreaterThan(0);
      expect(candidate.goalAttainmentRate).toBeCloseTo(((candidate.projectedFinalValue ?? 0) / result.target.targetAmount) * 100, 2);
      expect(candidate.metrics.worstPeriod).toBeTruthy();
      expect(candidate.metrics.annualizedReturnPct).not.toBeNull();
      expect(candidate.equityCurve).toHaveLength(sampleOhlc().length);
      expect(candidate.drawdownCurve).toHaveLength(sampleOhlc().length);
      expect(candidate.equityCurve.map(point => point.date)).toEqual(candidate.drawdownCurve.map(point => point.date));
      expect(candidate.tradeRecords.length).toBeGreaterThan(1);
      expect(candidate.tradeRecords[0]).toMatchObject({
        date: '2025-01-01',
        action: 'buy',
        reason: 'initial-capital',
        shares: 10_000,
        amount: 1_000_000,
        cashAfter: 0,
      });
      expect(candidate.tradeRecords.some(trade => trade.reason === 'monthly-contribution')).toBe(true);
      expect(candidate.suggestions.length).toBeGreaterThan(0);
      expect(candidate.warnings.join(' ')).toContain('買進持有');
    }
  });

  it('resolves target amount from target annual return', async () => {
    const service = createService(sampleOhlc()).service;

    const result = await service.run({
      targetAnnualReturnPct: 0,
      horizonYears: 1,
      initialCapital: 1_000,
      monthlyContribution: 100,
      universe: { type: 'single-symbol', symbols: ['2330'] },
    });

    expect(result.target).toMatchObject({
      source: 'targetAnnualReturnPct',
      targetAnnualReturnPct: 0,
      targetAmount: 1_200,
    });
    expect(result.cashflow.totalContributed).toBe(1_200);
  });

  it('returns partial goal attainment instead of binary attainment', async () => {
    const { service } = createService(sampleOhlc().slice(0, 4));

    const result = await service.run({
      targetAmount: 10_000,
      horizonYears: 1,
      initialCapital: 1_000,
      monthlyContribution: 0,
      universe: { type: 'single-symbol', symbols: ['2330'] },
    });

    expect(result.candidates[0].projectedFinalValue).toBeLessThan(10_000);
    expect(result.candidates[0].goalAttainmentRate).toBeGreaterThan(0);
    expect(result.candidates[0].goalAttainmentRate).toBeLessThan(100);
  });

  it('uses default date range when dates are omitted', async () => {
    const { service, repository } = createService(sampleOhlc());

    await service.run({
      targetAmount: 10_000,
      horizonYears: 1,
      initialCapital: 1_000,
      monthlyContribution: 100,
      universe: { type: 'single-symbol', symbols: ['2330'] },
    });

    expect(repository.getOhlcBySymbol).toHaveBeenCalledWith(expect.objectContaining({
      symbol: '2330',
      startDate: expect.any(String),
      endDate: expect.any(String),
    }));
  });

  it('rejects invalid requested date ranges', async () => {
    const { service } = createService(sampleOhlc());

    await expect(service.run({
      targetAmount: 10_000,
      horizonYears: 1,
      startDate: '2026-01-02',
      endDate: '2026-01-01',
      initialCapital: 1_000,
      monthlyContribution: 100,
      universe: { type: 'single-symbol', symbols: ['2330'] },
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns buy-and-hold only even for short historical ranges', async () => {
    const { service } = createService(sampleOhlc().slice(0, 4));

    const result = await service.run({
      targetAmount: 10_000,
      horizonYears: 1,
      initialCapital: 1_000,
      monthlyContribution: 100,
      universe: { type: 'single-symbol', symbols: ['2330'] },
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({ strategy: 'buy-and-hold', status: 'available' });
  });

  it('rejects missing target and unsupported universe', async () => {
    const service = createService([]).service;
    const base = {
      horizonYears: 1,
      initialCapital: 1_000,
      monthlyContribution: 100,
      universe: { type: 'single-symbol', symbols: ['2330'] },
    };

    await expect(service.run(base as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.run({
      ...base,
      targetAmount: 10_000,
      universe: { type: 'multi-symbol', symbols: ['2330', '2317'] },
    } as any)).rejects.toBeInstanceOf(BadRequestException);
  });
});

function createService(rows: ReturnType<typeof sampleOhlc>) {
  const repository = { getOhlcBySymbol: vi.fn().mockResolvedValue(rows) };
  const adjustedPriceService = { adjustOhlc: vi.fn().mockResolvedValue(rows) };
  return {
    repository,
    adjustedPriceService,
    service: new GoalSimulationService(repository as any, adjustedPriceService as any),
  };
}

describe('RunGoalSimulationDto', () => {
  it('validates the goal simulation request shape', async () => {
    const dto = plainToInstance(RunGoalSimulationDto, {
      targetAmount: 2_000_000,
      horizonYears: 5,
      startDate: '2021-01-01',
      endDate: '2026-01-01',
      initialCapital: 1_000_000,
      monthlyContribution: 10_000,
      maxDrawdownTolerancePct: 20,
      universe: { type: 'single-symbol', symbols: ['2330'] },
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid numbers and non single-symbol universe', async () => {
    const dto = plainToInstance(RunGoalSimulationDto, {
      targetAmount: 0,
      horizonYears: 0,
      initialCapital: 0,
      monthlyContribution: -1,
      universe: { type: 'single-symbol', symbols: ['2330', '2317'] },
    });

    const errors = await validate(dto);
    expect(errors.map(error => error.property)).toEqual(expect.arrayContaining([
      'targetAmount',
      'horizonYears',
      'initialCapital',
      'monthlyContribution',
      'universe',
    ]));
  });
});

function sampleOhlc() {
  return Array.from({ length: 90 }, (_, index) => {
    const date = DateTime.fromISO('2025-01-01').plus({ days: index });
    const closePrice = 100 + index + Math.sin(index / 3) * 8;
    return {
      date: date.toISODate(),
      closePrice,
      openPrice: closePrice,
      highPrice: closePrice + 2,
      lowPrice: closePrice - 2,
      tradeVolume: 1000,
    };
  });
}
