import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import type { EChartsOption } from 'echarts';
import { BacktestResult, BacktestStrategy, RunBacktestRequest } from '../../../../core/models/backtesting.model';
import { AuthService } from '../../../../core/services/auth.service';
import { BacktestingService } from '../../../../core/services/backtesting.service';
import { LoginRequiredService } from '../../../../core/services/login-required.service';
import { IndicatorChartComponent } from '../../../dashboard/components/trend-chart/indicator-chart/indicator-chart.component';

@Component({
  selector: 'app-backtest-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, IndicatorChartComponent],
  templateUrl: './backtest-panel.component.html',
  styleUrl: './backtest-panel.component.scss',
})
export class BacktestPanelComponent {
  private readonly authService = inject(AuthService);
  private readonly backtestingService = inject(BacktestingService);
  private readonly loginRequired = inject(LoginRequiredService);

  readonly symbol = input.required<string>();
  readonly endDate = input.required<string>();
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<BacktestResult | null>(null);

  strategy: BacktestStrategy = 'buy-and-hold';
  initialCash = 1_000_000;
  startDate = '';
  shortWindow = 20;
  longWindow = 60;
  orderSize: number | null = 100;
  feeRate = 0.001425;
  taxRate = 0.003;
  tradeOnClose = true;

  readonly chartOption = computed<EChartsOption | null>(() => {
    const result = this.result();
    if (!result?.equityCurve.length) return null;
    const dates = result.equityCurve.map(point => point.date);
    const equityByDate = new Map(result.equityCurve.map(point => [point.date, point.equity]));
    const entryMarks = result.trades
      .filter(trade => equityByDate.has(trade.entryDate))
      .map(trade => [trade.entryDate, equityByDate.get(trade.entryDate), `買 ${trade.size}`]);
    const exitMarks = result.trades
      .filter(trade => trade.exitDate && equityByDate.has(trade.exitDate))
      .map(trade => [trade.exitDate, equityByDate.get(trade.exitDate!), `賣 ${trade.size}`]);
    const benchmarkByDate = new Map(result.benchmark?.equityCurve.map(point => [point.date, point.equity]) ?? []);

    return {
      animation: false,
      backgroundColor: 'transparent',
      grid: [
        { left: 56, right: 20, top: 24, height: 150 },
        { left: 56, right: 20, top: 210, height: 90 },
      ],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
      },
      xAxis: [
        { type: 'category', data: dates, axisLabel: { formatter: (value: string) => value.slice(5), fontSize: 11 } },
        { type: 'category', gridIndex: 1, data: dates, axisLabel: { formatter: (value: string) => value.slice(5), fontSize: 11 } },
      ],
      yAxis: [
        { type: 'value', scale: true, axisLabel: { fontSize: 11 } },
        { type: 'value', gridIndex: 1, axisLabel: { fontSize: 11, formatter: '{value}%' } },
      ],
      series: [
        {
          name: '權益',
          type: 'line',
          data: result.equityCurve.map(point => point.equity),
          symbol: 'none',
          lineStyle: { width: 2, color: '#2563eb' },
        },
        ...(result.benchmark
          ? [{
              name: '買進持有',
              type: 'line' as const,
              data: dates.map(date => benchmarkByDate.get(date) ?? null),
              symbol: 'none',
              lineStyle: { width: 1.8, color: '#f59e0b', type: 'dashed' as const },
            }]
          : []),
        {
          name: '買進',
          type: 'scatter',
          data: entryMarks,
          symbolSize: 9,
          itemStyle: { color: '#ef4444' },
        },
        {
          name: '賣出',
          type: 'scatter',
          data: exitMarks,
          symbolSize: 9,
          itemStyle: { color: '#22c55e' },
        },
        {
          name: '回撤',
          type: 'line',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: result.drawdownCurve.map(point => point.drawdownPct),
          symbol: 'none',
          areaStyle: { opacity: 0.15, color: '#64748b' },
          lineStyle: { width: 1.5, color: '#64748b' },
        },
      ],
    };
  });

  openLoginPrompt() {
    this.loginRequired.open();
  }

  runBacktest() {
    if (!this.isLoggedIn() || this.loading()) {
      if (!this.isLoggedIn()) this.openLoginPrompt();
      return;
    }

    this.error.set(null);
    this.loading.set(true);
    const request: RunBacktestRequest = {
      symbol: this.symbol(),
      strategy: this.strategy,
      endDate: this.endDate(),
      initialCash: this.initialCash,
      feeRate: this.feeRate,
      taxRate: this.taxRate,
      tradeOnClose: this.tradeOnClose,
    };
    const orderSize = this.orderSize ?? undefined;
    request.params = this.strategy === 'sma-cross'
      ? {
          shortWindow: this.shortWindow,
          longWindow: this.longWindow,
          orderSize: orderSize ?? 100,
        }
      : orderSize ? { orderSize } : undefined;
    if (this.startDate) request.startDate = this.startDate;

    this.backtestingService.run(request)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: result => this.result.set(result),
        error: error => this.error.set(this.errorMessage(error)),
      });
  }

  formatNumber(value: number | null | undefined, digits = 0): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '-';
    return value.toLocaleString('zh-TW', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '-';
    return `${value >= 0 ? '+' : ''}${this.formatNumber(value, 2)}%`;
  }

  valueClass(value: number | null | undefined): string {
    if (!value) return 'flat';
    return value > 0 ? 'positive' : 'negative';
  }

  strategyDescription(): string {
    return this.strategy === 'buy-and-hold'
      ? '期初買進並持有到期末，可作為其他策略的基準。'
      : 'SMA 均線交叉，並同時顯示買進持有 benchmark。';
  }

  private errorMessage(error: any): string {
    const message = error?.error?.message ?? error?.message;
    return Array.isArray(message)
      ? message.join('，')
      : message || '回測執行失敗，請調整參數後再試。';
  }
}
