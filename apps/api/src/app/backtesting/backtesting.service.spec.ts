import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';
import { BacktestingService } from './backtesting.service';
import { RunBacktestDto } from './dto/run-backtest.dto';

describe('BacktestingService', () => {
  it('runs an SMA cross backtest and returns normalized metrics', async () => {
    const repository = {
      getOhlcBySymbol: vi.fn().mockResolvedValue(sampleOhlc()),
    };
    const adjustedPriceService = { adjustOhlc: vi.fn().mockResolvedValue(sampleOhlc()) };
    const service = new BacktestingService(repository as any, adjustedPriceService as any);

    const result = await service.runBacktest({
      symbol: '2330',
      strategy: 'sma-cross',
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      initialCash: 10_000,
      feeRate: 0,
      taxRate: 0,
      tradeOnClose: true,
      params: { shortWindow: 2, longWindow: 3, orderSize: 10 },
    });

    expect(repository.getOhlcBySymbol).toHaveBeenCalledWith({
      symbol: '2330',
      startDate: '2026-01-01',
      endDate: '2026-01-10',
    });
    expect(adjustedPriceService.adjustOhlc).toHaveBeenCalledWith('2330', sampleOhlc());
    expect(result).toMatchObject({
      symbol: '2330',
      strategy: 'sma-cross',
      requestedRange: { startDate: '2026-01-01', endDate: '2026-01-10' },
      resolvedRange: { startDate: '2026-01-01', endDate: '2026-01-10' },
      params: {
        shortWindow: 2,
        longWindow: 3,
        orderSize: 10,
        effectiveCommissionRate: 0,
      },
    });
    expect(result.metrics.tradeCount).toBeGreaterThan(0);
    expect(result.benchmark?.strategy).toBe('buy-and-hold');
    expect(result.benchmark?.equityCurve).toHaveLength(sampleOhlc().length);
    expect(result.equityCurve).toHaveLength(sampleOhlc().length);
    expect(result.drawdownCurve).toHaveLength(sampleOhlc().length);
    expect(result.trades[0]).toMatchObject({ size: 10 });
    expect(result.warnings.join(' ')).toContain('不構成投資建議');
    expect(result.warnings.join(' ')).toContain('還原 OHLC');
  });

  it('runs a buy-and-hold backtest without SMA params', async () => {
    const repository = {
      getOhlcBySymbol: vi.fn().mockResolvedValue(sampleOhlc()),
    };
    const service = new BacktestingService(repository as any, { adjustOhlc: vi.fn().mockResolvedValue(sampleOhlc()) } as any);

    const result = await service.runBacktest({
      symbol: '2330',
      strategy: 'buy-and-hold',
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      initialCash: 10_000,
      feeRate: 0,
      taxRate: 0,
      tradeOnClose: true,
    });

    expect(result.strategy).toBe('buy-and-hold');
    expect(result.params.shortWindow).toBeUndefined();
    expect(result.params.orderSize).toBeUndefined();
    expect(result.benchmark).toBeUndefined();
    expect(result.metrics.tradeCount).toBe(1);
    expect(result.trades[0].size).toBeGreaterThan(0);
    expect(result.warnings.join(' ')).toContain('期初建立一筆長部位');
  });

  it('rejects invalid SMA window relationship', async () => {
    const service = new BacktestingService({ getOhlcBySymbol: vi.fn() } as any, { adjustOhlc: vi.fn() } as any);

    await expect(service.runBacktest({
      symbol: '2330',
      strategy: 'sma-cross',
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      initialCash: 10_000,
      params: { shortWindow: 20, longWindow: 20, orderSize: 10 },
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects insufficient historical data', async () => {
    const service = new BacktestingService({
      getOhlcBySymbol: vi.fn().mockResolvedValue(sampleOhlc().slice(0, 2)),
    } as any, {
      adjustOhlc: vi.fn().mockResolvedValue(sampleOhlc().slice(0, 2)),
    } as any);

    await expect(service.runBacktest({
      symbol: '2330',
      strategy: 'sma-cross',
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      initialCash: 10_000,
      params: { shortWindow: 2, longWindow: 3, orderSize: 10 },
    })).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('RunBacktestDto', () => {
  it('validates symbol, strategy, cash, dates, costs and SMA params', async () => {
    const dto = plainToInstance(RunBacktestDto, {
      symbol: '2330',
      strategy: 'buy-and-hold',
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      initialCash: 1000000,
      feeRate: 0.001425,
      taxRate: 0.003,
      tradeOnClose: true,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid nested params', async () => {
    const dto = plainToInstance(RunBacktestDto, {
      symbol: '2330',
      strategy: 'sma-cross',
      initialCash: 1000000,
      params: { shortWindow: 1, longWindow: 2, orderSize: 0 },
    });

    const errors = await validate(dto);
    expect(errors.some(error => error.property === 'params')).toBe(true);
  });
});

function sampleOhlc() {
  return [10, 9, 8, 9, 10, 11, 10, 9, 8, 12].map((closePrice, index) => ({
    date: `2026-01-${String(index + 1).padStart(2, '0')}`,
    openPrice: closePrice,
    highPrice: closePrice + 1,
    lowPrice: closePrice - 1,
    closePrice,
    tradeVolume: 1000,
    tradeValue: closePrice * 1000,
  }));
}
