import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import type { EChartsOption } from 'echarts';
import {
  GoalSimulationResult,
  RunGoalSimulationRequest,
} from '../../core/models/goal-simulation.model';
import { GoalSimulationService } from '../../core/services/goal-simulation.service';
import { IndicatorChartComponent } from '../dashboard/components/trend-chart/indicator-chart/indicator-chart.component';

@Component({
  selector: 'app-goal-simulation',
  standalone: true,
  imports: [CommonModule, FormsModule, IndicatorChartComponent],
  templateUrl: './goal-simulation.component.html',
  styleUrl: './goal-simulation.component.scss',
})
export class GoalSimulationComponent {
  private readonly goalSimulationService = inject(GoalSimulationService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<GoalSimulationResult | null>(null);

  targetMode: 'amount' | 'annual-return' = 'amount';
  targetAmount: number | null = 3_000_000;
  targetAnnualReturnPct: number | null = 8;
  horizonYears = 5;
  startDate = '';
  endDate = '';
  initialCapital = 1_000_000;
  monthlyContribution = 10_000;
  symbol = '0050';

  constructor() {
    this.applyQueryParams();
    if (this.shouldAutoRun()) {
      this.runSimulation();
    }
  }

  readonly sortedCandidates = computed(() => {
    const result = this.result();
    if (!result) return [];
    return [...result.candidates].sort((a, b) => (b.projectedFinalValue ?? -Infinity) - (a.projectedFinalValue ?? -Infinity));
  });

  readonly chartOption = computed<EChartsOption | null>(() => {
    const candidate = this.sortedCandidates()[0];
    if (!candidate?.equityCurve.length) return null;
    const dates = candidate.equityCurve.map(point => point.date);
    const drawdownByDate = new Map(candidate.drawdownCurve.map(point => [point.date, point.drawdownPct]));

    return {
      animation: false,
      backgroundColor: 'transparent',
      grid: [
        { left: 58, right: 22, top: 24, height: 170 },
        { left: 58, right: 22, top: 230, height: 90 },
      ],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
      },
      xAxis: [
        { type: 'category', data: dates, axisLabel: { formatter: (value: string) => value.slice(0, 7), fontSize: 11 } },
        { type: 'category', gridIndex: 1, data: dates, axisLabel: { formatter: (value: string) => value.slice(0, 7), fontSize: 11 } },
      ],
      yAxis: [
        { type: 'value', scale: true, axisLabel: { fontSize: 11 } },
        { type: 'value', gridIndex: 1, axisLabel: { fontSize: 11, formatter: '{value}%' } },
      ],
      series: [
        {
          name: '資產',
          type: 'line',
          data: candidate.equityCurve.map(point => point.value),
          symbol: 'none',
          lineStyle: { width: 2, color: '#2563eb' },
        },
        {
          name: '回撤',
          type: 'line',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: dates.map(date => drawdownByDate.get(date) ?? null),
          symbol: 'none',
          areaStyle: { opacity: 0.15, color: '#64748b' },
          lineStyle: { width: 1.5, color: '#64748b' },
        },
      ],
    };
  });

  runSimulation() {
    if (this.loading()) {
      return;
    }

    this.error.set(null);
    this.loading.set(true);
    const request: RunGoalSimulationRequest = {
      horizonYears: this.horizonYears,
      initialCapital: this.initialCapital,
      monthlyContribution: this.monthlyContribution,
      universe: { type: 'single-symbol', symbols: [this.symbol.trim()] },
    };
    if (this.targetMode === 'amount' && this.targetAmount !== null) request.targetAmount = this.targetAmount;
    if (this.targetMode === 'annual-return' && this.targetAnnualReturnPct !== null) {
      request.targetAnnualReturnPct = this.targetAnnualReturnPct;
    }
    if (this.startDate) request.startDate = this.startDate;
    if (this.endDate) request.endDate = this.endDate;

    this.goalSimulationService.run(request)
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

  tradeReasonLabel(reason: 'initial-capital' | 'monthly-contribution'): string {
    return reason === 'initial-capital' ? '期初投入' : '每月投入';
  }

  private applyQueryParams() {
    const params = this.route.snapshot.queryParamMap;
    const symbol = params.get('symbol')?.trim().toUpperCase();
    if (symbol) this.symbol = symbol;

    const targetMode = params.get('targetMode');
    const targetAmount = this.numberParam('targetAmount');
    const targetAnnualReturnPct = this.numberParam('targetAnnualReturnPct');
    if (targetMode === 'amount' || targetMode === 'annual-return') {
      this.targetMode = targetMode;
    } else if (targetAnnualReturnPct !== null && targetAmount === null) {
      this.targetMode = 'annual-return';
    }

    if (targetAmount !== null) this.targetAmount = targetAmount;
    if (targetAnnualReturnPct !== null) this.targetAnnualReturnPct = targetAnnualReturnPct;
    this.horizonYears = this.numberParam('horizonYears') ?? this.horizonYears;
    this.initialCapital = this.numberParam('initialCapital') ?? this.initialCapital;
    this.monthlyContribution = this.numberParam('monthlyContribution') ?? this.monthlyContribution;

    const startDate = this.dateParam('startDate');
    const endDate = this.dateParam('endDate');
    if (startDate) this.startDate = startDate;
    if (endDate) this.endDate = endDate;
  }

  private numberParam(name: string): number | null {
    const rawValue = this.route.snapshot.queryParamMap.get(name);
    if (rawValue === null || rawValue.trim() === '') return null;
    const value = Number(rawValue);
    return Number.isFinite(value) ? value : null;
  }

  private dateParam(name: string): string | null {
    const value = this.route.snapshot.queryParamMap.get(name)?.trim();
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  }

  private shouldAutoRun(): boolean {
    return this.route.snapshot.queryParamMap.get('autoRun') === 'true';
  }

  private errorMessage(error: any): string {
    const message = error?.error?.message ?? error?.message;
    return Array.isArray(message)
      ? message.join('，')
      : message || '目標模擬執行失敗，請調整參數後再試。';
  }
}
