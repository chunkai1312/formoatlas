import { Component, computed, inject, input, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, combineLatest, switchMap, catchError, finalize, of, takeUntil } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import type { EChartsOption } from 'echarts';

import { DateTime } from 'luxon';
import { DashboardStateService, TimeRange, RANGE_MONTHS } from '../../../../core/services/dashboard-state.service';
import { TickerService } from '../../../../core/services/ticker.service';
import { TickerOhlc } from '../../../../core/models/ticker-ohlc.model';
import { IndicatorChartComponent } from '../trend-chart/indicator-chart/indicator-chart.component';

const BULL_COLOR = '#EF4444';
const BEAR_COLOR = '#22C55E';

const MA_DEFS: { period: number; color: string }[] = [
  { period: 5,   color: '#FBBF24' },  // 琥珀黃
  { period: 10,  color: '#F97316' },  // 橙（避開 BULL_COLOR）
  { period: 20,  color: '#A78BFA' },  // 淺紫
  { period: 60,  color: '#22D3EE' },  // 青藍（避開 BEAR_COLOR）
  { period: 120, color: '#EC4899' },  // 粉紅
  { period: 240, color: '#A3E635' },  // 黃綠
];

const WEEKLY_VISIBLE_MA_MAX_PERIOD = 60;
const KLINE_FETCH_YEARS = 5;

function toFiniteNumber(value: unknown): number | null {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeOhlcData(data: TickerOhlc[]): TickerOhlc[] {
  return data.flatMap((entry) => {
    const openPrice = toFiniteNumber(entry.openPrice);
    const highPrice = toFiniteNumber(entry.highPrice);
    const lowPrice = toFiniteNumber(entry.lowPrice);
    const closePrice = toFiniteNumber(entry.closePrice);
    const tradeValue = toFiniteNumber(entry.tradeValue) ?? 0;

    if (openPrice === null || highPrice === null || lowPrice === null || closePrice === null) {
      return [];
    }

    return [{
      ...entry,
      openPrice,
      highPrice,
      lowPrice,
      closePrice,
      tradeValue,
    }];
  });
}

export function getFetchStartDate(endDate: string): string {
  const end = DateTime.fromISO(endDate);
  return end.minus({ years: KLINE_FETCH_YEARS }).toISODate() ?? '';
}

function aggregateToWeekly(data: TickerOhlc[]): TickerOhlc[] {
  if (!data.length) return [];
  const weeks = new Map<string, TickerOhlc[]>();
  for (const d of data) {
    const dt = DateTime.fromISO(d.date);
    const key = `${dt.weekYear}-${String(dt.weekNumber).padStart(2, '0')}`;
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(d);
  }
  const result: TickerOhlc[] = [];
  for (const days of weeks.values()) {
    result.push({
      date: days[days.length - 1].date,
      openPrice: days[0].openPrice,
      highPrice: Math.max(...days.map(d => d.highPrice)),
      lowPrice: Math.min(...days.map(d => d.lowPrice)),
      closePrice: days[days.length - 1].closePrice,
      tradeValue: days.reduce((s, d) => s + d.tradeValue, 0),
    });
  }
  return result;
}

function calcMa(period: number, closes: number[]): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const window = closes.slice(i - period + 1, i + 1);
    if (window.some((value) => !Number.isFinite(value))) return null;
    const sum = window.reduce((a, b) => a + b, 0);
    return +( sum / period).toFixed(2);
  });
}

function buildKlineOption(
  displayData: TickerOhlc[],
  allData: TickerOhlc[],
  maDefs: { period: number; color: string }[],
  onHover?: (idx: number) => void,
): EChartsOption {
  // MA 用全量資料算，避免 slice 後前段出現 null warmup 缺口
  const allCloses = allData.map(d => d.closePrice);
  const displayOffset = allData.length - displayData.length;

  const dates = displayData.map(d => d.date);
  const closes = displayData.map(d => d.closePrice);
  const ohlc = displayData.map(d => [d.openPrice, d.closePrice, d.lowPrice, d.highPrice]);
  const volumes = displayData.map(d => ({
    value: +(d.tradeValue / 1e8).toFixed(2),
    itemStyle: { color: d.closePrice >= d.openPrice ? BULL_COLOR : BEAR_COLOR },
  }));

  const maSeries = maDefs.map(({ period, color }) => ({
    name: `MA${period}`,
    type: 'line' as const,
    xAxisIndex: 0,
    yAxisIndex: 0,
    data: calcMa(period, allCloses).slice(displayOffset),
    smooth: false,
    symbol: 'none',
    lineStyle: { width: 1.5, color },
    itemStyle: { color },
  }));

  return {
    animation: false,
    backgroundColor: 'transparent',
    legend: { show: false },
    grid: [
      { left: '80px', right: '20px', top: '40px', bottom: '60px' },
    ],
    xAxis: [
      {
        type: 'category', data: dates, gridIndex: 0,
        boundaryGap: true,
        axisLabel: { fontSize: 11, formatter: (v: string) => v.substring(5), rotate: 30 },
      },
    ],
    yAxis: [
      {
        type: 'value', gridIndex: 0, scale: true, splitNumber: 4,
        position: 'left',
        axisLabel: { fontSize: 11, formatter: (v: number) => v.toLocaleString('zh-TW') },
      },
      {
        type: 'value', gridIndex: 0, splitNumber: 2,
        position: 'right',
        max: (v: { max: number }) => v.max * 5,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisPointer: { show: false },
      },
    ],
    dataZoom: [],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params: any) => {
        const date = params[0]?.axisValue ?? '';
        const k = params.find((p: any) => p.seriesName === '加權指數');
        const v = params.find((p: any) => p.seriesName === '成交金額');
        if (!k) return date;

        const raw = (k.data ?? k.value) as number[];
        const [o, c, l, h] = raw.length === 5 ? raw.slice(1) : raw;
        const idx = k.dataIndex as number;
        onHover?.(idx);
        const prevClose = idx > 0 ? displayData[idx - 1].closePrice : o;
        const change = +(c - prevClose).toFixed(2);
        const pct = +((change / prevClose) * 100).toFixed(2);
        const color = change >= 0 ? BULL_COLOR : BEAR_COLOR;
        const sign = change >= 0 ? '+' : '';
        const changeLabel = change >= 0 ? '漲:' : '跌:';

        const row = (label: string, value: string, valColor?: string) =>
          `<tr><td style="color:var(--text-secondary);padding-right:12px">${label}</td>` +
          `<td style="text-align:right;color:${valColor ?? 'inherit'};font-weight:600">${value}</td></tr>`;

        let html = `<div style="font-size:12px;font-weight:700;margin-bottom:6px">${date}</div>`;
        const priceColor = (val: number) => val > prevClose ? BULL_COLOR : val < prevClose ? BEAR_COLOR : 'inherit';
        html += `<table style="border-collapse:collapse;font-size:12px">`;
        html += row('開:', o.toLocaleString('zh-TW'), priceColor(o));
        html += row('高:', h.toLocaleString('zh-TW'), priceColor(h));
        html += row('低:', l.toLocaleString('zh-TW'), priceColor(l));
        html += row('收:', c.toLocaleString('zh-TW'), priceColor(c));
        html += row(changeLabel, `${sign}${change.toLocaleString('zh-TW')}`, color);
        html += row('幅:', `${sign}${pct}%`, color);
        if (v) html += row('量:', `${v.value.toLocaleString('zh-TW')} 億元`);
        html += `</table>`;
        return html;
      },
    },
    series: [
      {
        name: '加權指數',
        type: 'candlestick',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: ohlc,
        itemStyle: {
          color: BULL_COLOR,
          color0: BEAR_COLOR,
          borderColor: BULL_COLOR,
          borderColor0: BEAR_COLOR,
        },
      },
      ...maSeries,
      {
        name: '成交金額',
        type: 'bar',
        xAxisIndex: 0,
        yAxisIndex: 1,
        data: volumes,
        barMaxWidth: 8,
        z: 1,
      },
    ],
  };
}

@Component({
  selector: 'app-kline-chart',
  standalone: true,
  imports: [CommonModule, IndicatorChartComponent],
  templateUrl: './kline-chart.component.html',
  styleUrl: './kline-chart.component.scss',
})
export class KlineChartComponent implements OnDestroy {
  private state = inject(DashboardStateService);
  private tickerService = inject(TickerService);
  private destroy$ = new Subject<void>();

  readonly symbol = input<string>('IX0001');

  readonly maDefs = MA_DEFS;
  readonly localRange = signal<TimeRange>('3M');
  readonly chartInterval = signal<'D' | 'W'>('D');
  readonly visibleMaDefs = computed(() =>
    this.chartInterval() === 'W'
      ? MA_DEFS.filter(({ period }) => period <= 60)
      : MA_DEFS
  );

  readonly ranges = computed<TimeRange[]>(() =>
    this.chartInterval() === 'W'
      ? ['3M', '6M', '1Y', '2Y']
      : ['1M', '3M', '6M', '1Y']
  );

  readonly rawData = signal<TickerOhlc[]>([]);
  readonly loading = signal(false);
  readonly hoveredIndex = signal<number | null>(null);

  readonly normalizedRawData = computed<TickerOhlc[]>(() => normalizeOhlcData(this.rawData()));

  readonly weeklyData = computed<TickerOhlc[]>(() => aggregateToWeekly(this.normalizedRawData()));

  readonly filteredData = computed<TickerOhlc[]>(() => {
    const data = this.chartInterval() === 'W' ? this.weeklyData() : this.normalizedRawData();
    if (!data.length) return data;
    const end = this.state.endDate();
    const months = RANGE_MONTHS[this.localRange()];
    const cutoff = DateTime.fromISO(end).minus({ months }).toISODate() ?? '';
    return data.filter(d => d.date >= cutoff);
  });

  // 預先計算各 MA 序列（顯示區間的完整陣列）
  readonly maData = computed<(number | null)[][]>(() => {
    const display = this.filteredData();
    const all = this.chartInterval() === 'W' ? this.weeklyData() : this.normalizedRawData();
    const visibleMaDefs = this.visibleMaDefs();
    if (!display.length || !all.length) return visibleMaDefs.map(() => []);
    const allCloses = all.map(d => d.closePrice);
    const offset = all.length - display.length;
    return visibleMaDefs.map(({ period }) => calcMa(period, allCloses).slice(offset));
  });

  // 目前要顯示的 MA 值（hover 中的 bar 或最後一根）
  readonly displayMaValues = computed<(number | null)[]>(() => {
    if (this.isNonTradingDay()) return this.visibleMaDefs().map(() => null);
    const maData = this.maData();
    const len = this.filteredData().length;
    if (!len) return this.visibleMaDefs().map(() => null);
    const idx = this.hoveredIndex() ?? (len - 1);
    return maData.map(series => series[idx] ?? null);
  });

  readonly isNonTradingDay = computed(() => {
    const data = this.normalizedRawData();
    const end = this.state.endDate();
    return data.length > 0 && data[data.length - 1].date !== end;
  });

  readonly chartOption = computed<EChartsOption | null>(() => {
    if (this.isNonTradingDay()) return null;
    const display = this.filteredData();
    const all = this.chartInterval() === 'W' ? this.weeklyData() : this.normalizedRawData();
    if (!display.length) return null;
    return buildKlineOption(display, all, this.visibleMaDefs(), (idx) => this.hoveredIndex.set(idx));
  });

  setLocalRange(range: TimeRange) {
    this.localRange.set(range);
  }

  setChartInterval(interval: 'D' | 'W') {
    const newRanges: TimeRange[] = interval === 'W'
      ? ['3M', '6M', '1Y', '2Y']
      : ['1M', '3M', '6M', '1Y'];
    if (!newRanges.includes(this.localRange())) {
      this.localRange.set(interval === 'W' ? '3M' : '1Y');
    }
    this.chartInterval.set(interval);
  }

  resetHover() {
    this.hoveredIndex.set(null);
  }

  constructor() {
    combineLatest([
      toObservable(this.state.endDate),
      toObservable(this.symbol),
    ])
      .pipe(
        switchMap(([end, sym]) => {
          const start = getFetchStartDate(end);
          this.loading.set(true);
          this.rawData.set([]);
          return this.tickerService.getTicker(sym, start, end).pipe(
            catchError(() => of([] as TickerOhlc[])),
            finalize(() => this.loading.set(false))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(data => this.rawData.set(data));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
