import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoalSimulationController } from './goal-simulation.controller';

describe('GoalSimulationController', () => {
  it('is protected by JwtAuthGuard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, GoalSimulationController);
    expect(guards).toContain(JwtAuthGuard);
  });

  it('delegates run requests to the service', async () => {
    const result = { candidates: [] };
    const service = { run: vi.fn().mockResolvedValue(result) };
    const controller = new GoalSimulationController(service as any);
    const body = {
      targetAmount: 2_000_000,
      horizonYears: 5,
      initialCapital: 1_000_000,
      monthlyContribution: 10_000,
      universe: { type: 'single-symbol', symbols: ['2330'] },
    };

    await expect(controller.run(body as any)).resolves.toBe(result);
    expect(service.run).toHaveBeenCalledWith(body);
  });
});
