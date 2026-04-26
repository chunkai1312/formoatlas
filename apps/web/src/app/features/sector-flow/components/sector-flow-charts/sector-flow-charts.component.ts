import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Subject, combineLatest, switchMap, catchError, of, takeUntil } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import type { EChartsOption } from 'echarts';
import { DateTime } from 'luxon';

import { SectorFlowStateService } from '../../sector-flow-state.service';
import { TickerService } from '../../../../core/services/ticker.service';
import { DashboardStateService, TimeRange, RANGE_MONTHS } from '../../../../core/services/dashboard-state.service';
import { TickerOhlc } from '../../../../core/models/ticker-ohlc.model';
import { IndicatorChartComponent } from '../../../dashboard/components/trend-chart/indicator-chart/indicator-chart.component';

@Component({
  selector: 'app-sector-flow-charts',
  standalone: true,
  imports: [CommonModule, MatCardModule, IndicatorChartComponent],
  templateUrl: './sector-flow-charts.component.html',
  styleUrl: './sector-flow-charts.component.scss',
})
export class SectorFlowChartsComponent implements OnDestroy {
  readonly state = inject(SectorFlowStateService);
  private dashState = inject(DashboardStateService);
  private tickerService = inject(TickerService);
  private destroy$ = new Subject<void>();

  readonly ranges: TimeRange[] = ['1M', '3M', '6M'];

  readonly taiexData = signal<TickerOhlc[]>([]);
  readonly sectorData = signal<TickerOhlc[]>([]);

  readonly localRange = this.state.localRange;

  readonly filteredTaiex = computed(() => this._filter(this.taiexData()));
  readonly filteredSector = computed(() => this._filter(this.sectorData()));

  private _filter(data: TickerOhlc[]): TickerOhlc[] {
    if (!data.length) return data;
    const end = this.dashState.endDate();
    const months = RANGE_MONTHS[this.localRange()];
    const cutoff = DateTime.fromISO(end).minus({ months }).toISODate() ?? '';
    return data.filter(d => d.date >= cutoff);
  }

  readonly moneyFlowOption = computed<EChartsOption | null>(() => {
    const taiex = this.filteredTaiex();
    const sector = this.filteredSector();
    const sectorName = this.state.selectedName();
    const benchmarkName = this.state.benchmarkName();
    if (!taiex.length || !sector.length) return null;

    const dates = taiex.map(d => d.date);
    // align sector to same dates
    const sectorMap = new Map(sector.map(d => [d.date, d]));
    const taiexPrices = taiex.map(d => d.closePrice);
    const sectorPrices = dates.map(d => sectorMap.get(d)?.closePrice ?? null);
    const sectorWeights = dates.map(d => sectorMap.get(d)?.tradeWeight ?? null);

    return {
      animation: false,
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', link: [{ xAxisIndex: 'all' }] },
        formatter: (params: any) => {
          const list: any[] = Array.isArray(params) ? params : [params];
          const date = list[0]?.axisValue ?? '';
          const sorted = [...list].sort((a, b) => a.seriesName === '成交比重%' ? 1 : b.seriesName === '成交比重%' ? -1 : 0);
          const lines = sorted.map((p: any) =>
            `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:4px"></span>${p.seriesName}: <b>${p.value ?? '-'}</b>`
          );
          return `<div style="font-size:12px">${date}<br>${lines.join('<br>')}</div>`;
        },
      },
      axisPointer: { link: [{ xAxisIndex: 'all' }] },
      grid: [
        { left: '72px', right: '72px', top: '24px', bottom: '35%' },
        { left: '72px', right: '72px', top: '70%', bottom: '36px' },
      ],
      xAxis: [
        { type: 'category', data: dates, gridIndex: 0, boundaryGap: false, axisLabel: { show: false } },
        { type: 'category', data: dates, gridIndex: 1, boundaryGap: false, axisLabel: { fontSize: 11, formatter: (v: string) => v.substring(5), rotate: 30 } },
      ],
      yAxis: [
        { type: 'value', gridIndex: 0, name: benchmarkName, scale: true, nameTextStyle: { fontSize: 11 }, axisLabel: { fontSize: 11, formatter: (v: number) => v.toLocaleString() }, splitLine: { lineStyle: { opacity: 0.3 } } },
        { type: 'value', gridIndex: 0, name: sectorName, scale: true, nameTextStyle: { fontSize: 11 }, position: 'right', axisLabel: { fontSize: 11, formatter: (v: number) => v.toLocaleString() }, splitLine: { show: false } },
        { type: 'value', gridIndex: 1, scale: true, position: 'right', minInterval: 0.5, splitNumber: 3, axisLabel: { fontSize: 10, formatter: (v: number) => v.toFixed(2) + '%' }, splitLine: { lineStyle: { opacity: 0.3 } } },
      ],
      series: [
        { name: benchmarkName, type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: taiexPrices, smooth: false, symbol: 'none', lineStyle: { color: '#60A5FA', width: 1.5 }, itemStyle: { color: '#60A5FA' } },
        { name: sectorName, type: 'line', xAxisIndex: 0, yAxisIndex: 1, data: sectorPrices, smooth: false, symbol: 'none', lineStyle: { color: '#F472B6', width: 1.5 }, itemStyle: { color: '#F472B6' } },
        { name: '成交比重%', type: 'line', xAxisIndex: 1, yAxisIndex: 2, data: sectorWeights, smooth: false, symbol: 'none', lineStyle: { color: '#34D399', width: 1.5 }, itemStyle: { color: '#34D399' }, areaStyle: { opacity: 0.1 } },
      ],
    };
  });

  constructor() {
    combineLatest([
      toObservable(this.dashState.endDate),
      toObservable(this.state.selectedSymbol),
      toObservable(this.state.benchmarkSymbol),
    ])
      .pipe(
        switchMap(([end, sym, benchmark]) => {
          if (!sym) return of([[], []] as [TickerOhlc[], TickerOhlc[]]);
          const start = DateTime.fromISO(end).minus({ months: 6 }).toISODate() ?? '';
          return combineLatest([
            this.tickerService.getTicker(benchmark, start, end).pipe(catchError(() => of([] as TickerOhlc[]))),
            this.tickerService.getTicker(sym, start, end).pipe(catchError(() => of([] as TickerOhlc[]))),
          ]);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(([taiex, sector]) => {
        this.taiexData.set(taiex as TickerOhlc[]);
        this.sectorData.set(sector as TickerOhlc[]);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSectorChange(value: string) {
    this.state.selectedSymbol.set(value);
    const found = this.state.sectors().find(s => s.symbol === value);
    if (found) this.state.selectedName.set(found.name);
  }

  setRange(range: TimeRange) {
    this.state.localRange.set(range);
  }
}
