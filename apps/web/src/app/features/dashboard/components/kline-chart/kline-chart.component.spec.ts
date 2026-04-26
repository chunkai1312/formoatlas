import { TestBed } from '@angular/core/testing';
import { Component, computed, input, output, signal } from '@angular/core';
import { of } from 'rxjs';
import type { EChartsOption } from 'echarts';
import { DateTime } from 'luxon';

import { getFetchStartDate, KlineChartComponent } from './kline-chart.component';
import { DashboardStateService, TimeRange } from '../../../../core/services/dashboard-state.service';
import { TickerService } from '../../../../core/services/ticker.service';
import { TickerOhlc } from '../../../../core/models/ticker-ohlc.model';
import { IndicatorChartComponent } from '../trend-chart/indicator-chart/indicator-chart.component';

class MockDashboardStateService {
  readonly selectedDate = signal('2026-04-25');
  readonly endDate = computed(() => this.selectedDate());
}

function buildSampleData(totalDays: number, endDate: string): TickerOhlc[] {
  const end = DateTime.fromISO(endDate);
  return Array.from({ length: totalDays }, (_, index) => {
    const day = end.minus({ days: totalDays - index - 1 }).toISODate()!;
    const base = 20000 + index * 10;
    return {
      date: day,
      openPrice: base,
      highPrice: base + 50,
      lowPrice: base - 50,
      closePrice: base + 20,
      tradeValue: 100_000_000 + index * 1_000_000,
    };
  });
}

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

@Component({
  selector: 'app-indicator-chart',
  standalone: true,
  template: '',
})
class MockIndicatorChartComponent {
  option = input<EChartsOption | null>(null);
  height = input<string>('360px');
  chartGlobalout = output<void>();
}

describe('KlineChartComponent', () => {
  const dashboardState = new MockDashboardStateService();
  const sampleData = buildSampleData(1500, dashboardState.endDate());
  let fetchCount = 0;
  const tickerService = {
    getTicker: () => {
      fetchCount += 1;
      return of(sampleData);
    },
  };

  beforeEach(async () => {
    dashboardState.selectedDate.set('2026-04-25');
    fetchCount = 0;
    (globalThis as typeof globalThis & { ResizeObserver: typeof MockResizeObserver }).ResizeObserver = MockResizeObserver;

    TestBed.overrideComponent(KlineChartComponent, {
      remove: { imports: [IndicatorChartComponent] },
      add: { imports: [MockIndicatorChartComponent] },
    });

    await TestBed.configureTestingModule({
      imports: [KlineChartComponent],
      providers: [
        { provide: DashboardStateService, useValue: dashboardState },
        { provide: TickerService, useValue: tickerService },
      ],
    }).compileComponents();
  });

  it('keeps all six moving averages in daily mode', () => {
    const fixture = TestBed.createComponent(KlineChartComponent);
    const component = fixture.componentInstance;
    component.rawData.set(sampleData);

    expect(component.visibleMaDefs().map((def) => def.period)).toEqual([5, 10, 20, 60, 120, 240]);
    expect(seriesNames(component.chartOption())).toEqual([
      '加權指數',
      'MA5',
      'MA10',
      'MA20',
      'MA60',
      'MA120',
      'MA240',
      '成交金額',
    ]);
    expect(component.displayMaValues()).toHaveLength(6);
  });

  it('limits weekly mode to four moving averages across all supported ranges', () => {
    const fixture = TestBed.createComponent(KlineChartComponent);
    const component = fixture.componentInstance;
    component.rawData.set(sampleData);

    component.setChartInterval('W');

    expect(component.visibleMaDefs().map((def) => def.period)).toEqual([5, 10, 20, 60]);
    expect(component.displayMaValues()).toHaveLength(4);

    for (const range of ['3M', '6M', '1Y', '2Y'] as TimeRange[]) {
      component.setLocalRange(range);
      expect(seriesNames(component.chartOption())).toEqual([
        '加權指數',
        'MA5',
        'MA10',
        'MA20',
        'MA60',
        '成交金額',
      ]);
    }

    component.setLocalRange('2Y');
    expect(component.maData()[3]?.[0]).not.toBeNull();
  });

  it('keeps the weekly info bar aligned with the supported MA list while hovering', () => {
    const fixture = TestBed.createComponent(KlineChartComponent);
    const component = fixture.componentInstance;
    component.rawData.set(sampleData);

    component.setChartInterval('W');
    component.hoveredIndex.set(5);

    expect(component.displayMaValues()).toHaveLength(component.visibleMaDefs().length);
    expect(component.visibleMaDefs().map((def) => def.period)).not.toContain(120);
    expect(component.visibleMaDefs().map((def) => def.period)).not.toContain(240);
  });

  it('drops invalid OHLC rows so weekly MA values do not become NaN', () => {
    const fixture = TestBed.createComponent(KlineChartComponent);
    const component = fixture.componentInstance;
    const malformedData = sampleData.map((entry, index) =>
      index === 200 ? { ...entry, closePrice: Number.NaN } : entry
    );

    component.rawData.set(malformedData);
    component.setChartInterval('W');
    component.setLocalRange('2Y');

    const ma60Series = component.maData()[3] ?? [];
    expect(ma60Series.some((value) => Number.isNaN(value))).toBe(false);
    expect(Number.isNaN(component.displayMaValues()[3] as number)).toBe(false);
  });

  it('fetches five years of history for both daily and weekly modes', () => {
    expect(getFetchStartDate('2026-04-25')).toBe('2021-04-25');
  });

  it('does not refetch data when switching between daily and weekly tabs', async () => {
    const fixture = TestBed.createComponent(KlineChartComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('symbol', 'IX0001');
    TestBed.flushEffects();
    expect(fetchCount).toBe(1);

    component.setChartInterval('W');
    component.setChartInterval('D');
    component.setChartInterval('W');
    TestBed.flushEffects();

    expect(fetchCount).toBe(1);
  });
});

function seriesNames(option: EChartsOption | null): string[] {
  const series = Array.isArray(option?.series) ? option.series : [];
  return series.map((entry) => String((entry as { name?: string | number }).name ?? ''));
}
