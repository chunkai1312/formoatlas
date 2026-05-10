import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BacktestingController } from './backtesting.controller';

describe('BacktestingController', () => {
  it('is protected by JwtAuthGuard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, BacktestingController);
    expect(guards).toContain(JwtAuthGuard);
  });

  it('delegates run requests to the service', async () => {
    const result = { symbol: '2330', metrics: { tradeCount: 1 } };
    const service = { runBacktest: vi.fn().mockResolvedValue(result) };
    const controller = new BacktestingController(service as any);
    const body = {
      symbol: '2330',
      strategy: 'sma-cross',
      initialCash: 1_000_000,
      params: { shortWindow: 5, longWindow: 20, orderSize: 100 },
    };

    await expect(controller.run(body as any)).resolves.toBe(result);
    expect(service.runBacktest).toHaveBeenCalledWith(body);
  });
});
