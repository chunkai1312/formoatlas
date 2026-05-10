import { Strategy, crossover, crossunder } from 'node-backtesting';
import { SMA } from 'technicalindicators';

export interface SmaCrossStrategyParams {
  shortWindow: number;
  longWindow: number;
  orderSize: number;
}

const DEFAULT_PARAMS: SmaCrossStrategyParams = {
  shortWindow: 20,
  longWindow: 60,
  orderSize: 100,
};

export class SmaCrossStrategy extends Strategy {
  params: SmaCrossStrategyParams = DEFAULT_PARAMS;

  init(): void {
    const shortLine = SMA.calculate({
      period: this.params.shortWindow,
      values: this.data.close,
    });
    const longLine = SMA.calculate({
      period: this.params.longWindow,
      values: this.data.close,
    });

    this.addIndicator('shortSma', shortLine, { overlay: true, color: '#f97316' });
    this.addIndicator('longSma', longLine, { overlay: true, color: '#22d3ee' });
    this.addSignal('crossUp', crossover(this.getIndicator('shortSma') as number[], this.getIndicator('longSma') as number[]));
    this.addSignal('crossDown', crossunder(this.getIndicator('shortSma') as number[], this.getIndicator('longSma') as number[]));
  }

  next(ctx: { index: number; signals: Map<string, boolean> }): void {
    if (ctx.index < this.params.longWindow) return;

    if (ctx.signals.get('crossUp') && !this.position?.isLong) {
      this.buy({ size: this.params.orderSize });
    }

    if (ctx.signals.get('crossDown') && this.position?.isLong) {
      this.position.close();
    }
  }
}
