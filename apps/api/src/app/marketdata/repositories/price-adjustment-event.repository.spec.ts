import { describe, expect, it, vi } from 'vitest';

vi.mock('../schemas/price-adjustment-event.schema', () => ({
  PriceAdjustmentEvent: { name: 'PriceAdjustmentEvent' },
}));

import { PriceAdjustmentEventRepository } from './price-adjustment-event.repository';

describe('PriceAdjustmentEventRepository', () => {
  it('upserts events using symbol, exchange, event type and effective date', async () => {
    const model = {
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
    };
    const repository = new PriceAdjustmentEventRepository(model as any);
    const event = {
      symbol: '2330',
      exchange: 'TWSE',
      market: 'TSE',
      eventType: 'dividend',
      effectiveDate: '2026-07-01',
      previousClose: 100,
      referencePrice: 95,
      factor: 0.95,
      raw: {},
    } as any;

    await repository.upsertEvent(event);

    expect(model.updateOne).toHaveBeenCalledWith(
      { symbol: '2330', exchange: 'TWSE', eventType: 'dividend', effectiveDate: '2026-07-01' },
      { $set: event },
      { upsert: true },
    );
  });

  it('preserves same-day multiple events as separate upserts', async () => {
    const model = {
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
    };
    const repository = new PriceAdjustmentEventRepository(model as any);

    await repository.upsertEvents([
      event({ eventType: 'dividend', factor: 0.9 }),
      event({ eventType: 'capitalReduction', factor: 1.2 }),
    ] as any);

    expect(model.updateOne).toHaveBeenCalledTimes(2);
    expect(model.updateOne.mock.calls[0][0]).toMatchObject({ eventType: 'dividend', effectiveDate: '2026-07-01' });
    expect(model.updateOne.mock.calls[1][0]).toMatchObject({ eventType: 'capitalReduction', effectiveDate: '2026-07-01' });
  });

  it('looks up events by normalized symbol through end date', async () => {
    const exec = vi.fn().mockResolvedValue([]);
    const sort = vi.fn(() => ({ lean: () => ({ exec }) }));
    const select = vi.fn(() => ({ sort }));
    const find = vi.fn(() => ({ select }));
    const repository = new PriceAdjustmentEventRepository({ find } as any);

    await repository.findBySymbolThroughDate(' 2330 ', '2026-05-10');

    expect(find).toHaveBeenCalledWith({
      symbol: '2330',
      effectiveDate: { $lte: '2026-05-10' },
    });
    expect(sort).toHaveBeenCalledWith({ effectiveDate: 1, eventType: 1 });
  });
});

function event(overrides: Record<string, unknown>) {
  return {
    symbol: '2330',
    exchange: 'TWSE',
    market: 'TSE',
    eventType: 'dividend',
    effectiveDate: '2026-07-01',
    previousClose: 100,
    referencePrice: 95,
    factor: 0.95,
    raw: {},
    ...overrides,
  };
}
