import { Strategy } from 'node-backtesting';

export interface BuyAndHoldStrategyParams {
  orderSize?: number;
}

export class BuyAndHoldStrategy extends Strategy {
  params: BuyAndHoldStrategyParams = {};

  init(): void {
    // No indicators are needed. The strategy opens one long position and holds it.
  }

  next(ctx: { index: number }): void {
    if (ctx.index !== 0 || this.position?.isLong) return;

    this.buy({
      size: this.params.orderSize ?? 0.999999,
    });
  }
}
