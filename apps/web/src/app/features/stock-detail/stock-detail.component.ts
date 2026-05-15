import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, finalize, of, switchMap } from 'rxjs';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { EChartsOption } from 'echarts';
import { DateTime } from 'luxon';
import { DashboardStateService, RANGE_MONTHS, TimeRange } from '../../core/services/dashboard-state.service';
import { TickerService } from '../../core/services/ticker.service';
import { AuthService } from '../../core/services/auth.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { LoginRequiredService } from '../../core/services/login-required.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';
import { StockSummary } from '../../core/models/stock-summary.model';
import { TickerOhlc } from '../../core/models/ticker-ohlc.model';
import { IndicatorChartComponent } from '../dashboard/components/trend-chart/indicator-chart/indicator-chart.component';
import { BacktestPanelComponent } from './components/backtest-panel/backtest-panel.component';

const BULL_COLOR = '#ef4444';
const BEAR_COLOR = '#22c55e';
const WEEKLY_VISIBLE_MA_MAX_PERIOD = 60;

type ChartInterval = 'D' | 'W';
type PriceBasis = 'raw' | 'adjusted';

const MA_DEFS: { period: number; color: string }[] = [
  { period: 5, color: '#FBBF24' },
  { period: 10, color: '#F97316' },
  { period: 20, color: '#A78BFA' },
  { period: 60, color: '#22D3EE' },
  { period: 120, color: '#EC4899' },
  { period: 240, color: '#A3E635' },
];

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
    const tradeVolume = toFiniteNumber(entry.tradeVolume) ?? 0;

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
      tradeVolume,
    }];
  });
}

function aggregateToWeekly(data: TickerOhlc[]): TickerOhlc[] {
  if (!data.length) return [];
  const weeks = new Map<string, TickerOhlc[]>();
  for (const row of data) {
    const date = DateTime.fromISO(row.date);
    const key = `${date.weekYear}-${String(date.weekNumber).padStart(2, '0')}`;
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(row);
  }

  return [...weeks.values()].map((days) => ({
    date: days[days.length - 1].date,
    openPrice: days[0].openPrice,
    highPrice: Math.max(...days.map(row => row.highPrice)),
    lowPrice: Math.min(...days.map(row => row.lowPrice)),
    closePrice: days[days.length - 1].closePrice,
    tradeVolume: days.reduce((sum, row) => sum + (row.tradeVolume ?? 0), 0),
    tradeValue: days.reduce((sum, row) => sum + row.tradeValue, 0),
  }));
}

function calcMa(period: number, closes: number[]): (number | null)[] {
  return closes.map((_, index) => {
    if (index < period - 1) return null;
    const window = closes.slice(index - period + 1, index + 1);
    if (window.some(value => !Number.isFinite(value))) return null;
    return +(window.reduce((sum, value) => sum + value, 0) / period).toFixed(2);
  });
}

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, IndicatorChartComponent, BacktestPanelComponent],
  templateUrl: './stock-detail.component.html',
  styleUrl: './stock-detail.component.scss',
})
export class StockDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dashboardState = inject(DashboardStateService);
  private readonly tickerService = inject(TickerService);
  private readonly authService = inject(AuthService);
  private readonly watchlistService = inject(WatchlistService);
  private readonly loginRequired = inject(LoginRequiredService);
  private readonly researchContext = inject(ResearchAssistantContextService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedDate = this.dashboardState.selectedDate;
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly watchList = this.watchlistService.watchList;
  readonly summary = signal<StockSummary | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly savingWatchlist = signal(false);
  readonly currentSymbol = signal('');
  readonly localRange = signal<TimeRange>('3M');
  readonly chartInterval = signal<ChartInterval>('D');
  readonly priceBasis = signal<PriceBasis>('raw');
  readonly chartOhlc = signal<TickerOhlc[]>([]);
  readonly hoveredIndex = signal<number | null>(null);
  readonly maDefs = MA_DEFS;

  readonly isFallbackDate = computed(() => {
    const summary = this.summary();
    return !!summary && summary.date !== summary.requestedDate;
  });
  readonly isInWatchlist = computed(() => {
    const summary = this.summary();
    return !!summary && this.watchList().includes(summary.symbol);
  });
  readonly priceClass = computed(() => this.valueClass(this.summary()?.quote.change ?? 0));
  readonly marketLabel = computed(() => this.summary()?.market === 'OTC' ? '上櫃' : '上市');
  readonly ranges = computed<TimeRange[]>(() =>
    this.chartInterval() === 'W'
      ? ['3M', '6M', '1Y', '2Y']
      : ['1M', '3M', '6M', '1Y']
  );
  readonly visibleMaDefs = computed(() =>
    this.chartInterval() === 'W'
      ? MA_DEFS.filter(({ period }) => period <= WEEKLY_VISIBLE_MA_MAX_PERIOD)
      : MA_DEFS
  );
  readonly normalizedOhlc = computed(() => normalizeOhlcData(this.chartOhlc()));
  readonly visibleHotStockRanks = computed(() => this.summary()?.context.hotStockRanks.slice(0, 3) ?? []);
  readonly hiddenHotStockRankCount = computed(() => Math.max((this.summary()?.context.hotStockRanks.length ?? 0) - 3, 0));
  readonly dailySummaryMetrics = computed(() => {
    const summary = this.summary();
    if (!summary) return [];
    const quote = summary.quote;
    return [
      { label: '開盤', value: this.formatNumber(quote.openPrice, 2) },
      { label: '最高', value: this.formatNumber(quote.highPrice, 2), tone: 'positive' },
      { label: '最低', value: this.formatNumber(quote.lowPrice, 2), tone: 'negative' },
      { label: '收盤', value: this.formatNumber(quote.closePrice, 2), tone: this.valueClass(quote.change) },
      { label: '成交量', value: this.formatShareLots(quote.tradeVolume) },
      { label: '成交金額', value: this.formatBillion(quote.tradeValue) },
      { label: '振幅', value: this.formatPercent(this.intradayAmplitudePct(summary)) },
      { label: '量比', value: this.formatRatio(this.volumeRatio(summary)) },
    ];
  });
  readonly weeklyData = computed(() => aggregateToWeekly(this.normalizedOhlc()));
  readonly chartAllData = computed(() =>
    this.chartInterval() === 'W' ? this.weeklyData() : this.normalizedOhlc()
  );
  readonly filteredData = computed(() => {
    const data = this.chartAllData();
    if (!data.length) return data;
    const endDate = this.summary()?.date ?? this.dashboardState.endDate();
    const cutoff = DateTime.fromISO(endDate).minus({ months: RANGE_MONTHS[this.localRange()] }).toISODate() ?? '';
    return data.filter(row => row.date >= cutoff);
  });
  readonly maData = computed<(number | null)[][]>(() => {
    const display = this.filteredData();
    const all = this.chartAllData();
    const visibleMaDefs = this.visibleMaDefs();
    if (!display.length || !all.length) return visibleMaDefs.map(() => []);
    const allCloses = all.map(row => row.closePrice);
    const offset = all.length - display.length;
    return visibleMaDefs.map(({ period }) => calcMa(period, allCloses).slice(offset));
  });
  readonly displayMaValues = computed<(number | null)[]>(() => {
    const len = this.filteredData().length;
    if (!len) return this.visibleMaDefs().map(() => null);
    const index = this.hoveredIndex() ?? (len - 1);
    return this.maData().map(series => series[index] ?? null);
  });
  readonly chartOption = computed(() => {
    const display = this.filteredData();
    if (!display.length) return null;
    return this.buildChartOption(display, this.chartAllData(), this.visibleMaDefs(), (index) => this.hoveredIndex.set(index));
  });

  readonly assistantShortcuts = [
    {
      label: '分析量價與法人',
      question: '分析這檔今日量價、法人籌碼與市場脈絡。',
    },
    {
      label: '檢查主要風險',
      question: '找出這檔目前盤後資料中值得留意的主要風險。',
    },
    {
      label: '列出追蹤指標',
      question: '列出這檔接下來幾個交易日應追蹤的量價、法人與市場指標。',
    },
  ];

  constructor() {
    combineLatest([
      this.route.paramMap,
      toObservable(this.dashboardState.endDate),
    ])
      .pipe(
        switchMap(([params, date]) => {
          const symbol = (params.get('symbol') ?? '').trim().toUpperCase();
          this.currentSymbol.set(symbol);
          this.summary.set(null);
          this.error.set(null);
          if (!symbol) {
            this.loading.set(false);
            this.error.set('缺少股票代號。');
            return of(null);
          }
          this.loading.set(true);
          return this.tickerService.getStockSummary(symbol, date).pipe(
            catchError((error) => {
              this.error.set(error?.status === 404 ? '找不到這檔股票資料。' : '個股資料載入失敗，請稍後重試。');
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(summary => {
        this.summary.set(summary);
        this.loadChartOhlc(summary);
        if (summary) {
          this.researchContext.setContext({
            route: 'stock-detail',
            market: summary.market,
            symbol: summary.symbol,
            sector: summary.industryName ?? undefined,
          });
        }
      });

    if (this.isLoggedIn()) {
      this.watchlistService.load().subscribe({ error: () => undefined });
    }
  }

  toggleWatchlist() {
    const summary = this.summary();
    if (!summary || this.savingWatchlist()) return;
    if (!this.isLoggedIn()) {
      this.loginRequired.open();
      return;
    }

    this.savingWatchlist.set(true);
    const request = this.isInWatchlist()
      ? this.watchlistService.remove(summary.symbol)
      : this.watchlistService.add(summary.symbol);

    request
      .pipe(finalize(() => this.savingWatchlist.set(false)))
      .subscribe({ error: () => undefined });
  }

  useAssistantShortcut(question: string) {
    const summary = this.summary();
    if (!summary) return;
    this.researchContext.requestAssistant({
      mode: 'stock',
      question,
      context: {
        route: 'stock-detail',
        market: summary.market,
        symbol: summary.symbol,
        sector: summary.industryName ?? undefined,
      },
    });
  }

  valueClass(value: number | null | undefined): string {
    if (!value) return 'flat';
    return value > 0 ? 'positive' : 'negative';
  }

  formatNumber(value: number | null | undefined, digits = 0): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '-';
    return value.toLocaleString('zh-TW', {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    });
  }

  formatShareLots(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : `${this.formatNumber(Math.round(value / 1000))} 張`;
  }

  formatLots(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : `${this.formatNumber(value)} 張`;
  }

  formatSignedLots(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    const sign = value > 0 ? '+' : '';
    return `${sign}${this.formatLots(value)}`;
  }

  formatInstitutionalDetailLots(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : this.formatLots(value);
  }

  formatBillion(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : `${this.formatNumber(value / 1e8, 2)} 億`;
  }

  formatPercent(value: number | null | undefined): string {
    return value === null || value === undefined || !Number.isFinite(value)
      ? '-'
      : `${this.formatNumber(value, 2)}%`;
  }

  formatRatio(value: number | null | undefined): string {
    return value === null || value === undefined || !Number.isFinite(value)
      ? '-'
      : `${this.formatNumber(value, 2)}x`;
  }

  consecutiveLabel(name: string, value: number | null): string {
    if (value === null || Math.abs(value) < 2) return '';
    return value > 0 ? `${name}連 ${value} 買` : `${name}連 ${Math.abs(value)} 賣`;
  }

  setLocalRange(range: TimeRange) {
    this.localRange.set(range);
    this.resetHover();
  }

  setChartInterval(interval: ChartInterval) {
    const newRanges: TimeRange[] = interval === 'W'
      ? ['3M', '6M', '1Y', '2Y']
      : ['1M', '3M', '6M', '1Y'];
    if (!newRanges.includes(this.localRange())) {
      this.localRange.set(interval === 'W' ? '3M' : '1Y');
    }
    this.chartInterval.set(interval);
    this.resetHover();
  }

  setPriceBasis(basis: PriceBasis) {
    if (this.priceBasis() === basis) return;
    this.priceBasis.set(basis);
    this.loadChartOhlc(this.summary());
    this.resetHover();
  }

  resetHover() {
    this.hoveredIndex.set(null);
  }

  private loadChartOhlc(summary: StockSummary | null) {
    if (!summary) {
      this.chartOhlc.set([]);
      return;
    }

    if (this.priceBasis() === 'raw') {
      this.chartOhlc.set(summary.ohlc);
      return;
    }

    const startDate = DateTime.fromISO(summary.date).minus({ years: 5 }).toISODate() ?? summary.requestedDate;
    this.tickerService.getTicker(summary.symbol, startDate, summary.date, true)
      .pipe(
        catchError(() => of(summary.ohlc)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(rows => {
        const current = this.summary();
        if (this.priceBasis() === 'adjusted' && current?.symbol === summary.symbol && current.date === summary.date) {
          this.chartOhlc.set(rows);
        }
      });
  }

  private intradayAmplitudePct(summary: StockSummary): number | null {
    const { highPrice, lowPrice, closePrice } = summary.quote;
    if (!closePrice) return null;
    return ((highPrice - lowPrice) / closePrice) * 100;
  }

  private volumeRatio(summary: StockSummary): number | null {
    const recentVolumes = summary.ohlc
      .slice(-5)
      .flatMap((row): number[] => {
        const volume = toFiniteNumber(row.tradeVolume);
        return volume !== null && volume > 0 ? [volume] : [];
      });
    if (!recentVolumes.length || !summary.quote.tradeVolume) return null;
    const averageVolume = recentVolumes.reduce<number>((sum, volume) => sum + volume, 0) / recentVolumes.length;
    return averageVolume > 0 ? summary.quote.tradeVolume / averageVolume : null;
  }

  private buildChartOption(
    data: TickerOhlc[],
    allData: TickerOhlc[],
    maDefs: { period: number; color: string }[],
    onHover?: (index: number) => void,
  ): EChartsOption | null {
    if (!data.length) return null;
    const dates = data.map(row => row.date);
    const allCloses = allData.map(row => row.closePrice);
    const offset = allData.length - data.length;
    const maSeries = maDefs.map(({ period, color }) => ({
      name: `MA${period}`,
      type: 'line' as const,
      data: calcMa(period, allCloses).slice(offset),
      smooth: false,
      symbol: 'none',
      lineStyle: { width: 1.5, color },
      itemStyle: { color },
    }));

    return {
      animation: false,
      backgroundColor: 'transparent',
      legend: { show: false },
      grid: { left: 64, right: 32, top: 28, bottom: 54 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
        formatter: (params: any) => {
          const date = params[0]?.axisValue ?? '';
          const kline = params.find((param: any) => param.seriesName === 'K 線');
          const volume = params.find((param: any) => param.seriesName === '成交量');
          if (!kline) return date;

          const raw = (kline.data ?? kline.value) as number[];
          const [open, close, low, high] = raw.length === 5 ? raw.slice(1) : raw;
          const index = kline.dataIndex as number;
          onHover?.(index);
          const prevClose = index > 0 ? data[index - 1].closePrice : open;
          const change = +(close - prevClose).toFixed(2);
          const pct = prevClose ? +((change / prevClose) * 100).toFixed(2) : 0;
          const color = change >= 0 ? BULL_COLOR : BEAR_COLOR;
          const sign = change >= 0 ? '+' : '';
          const row = (label: string, value: string, valueColor = 'inherit') =>
            `<tr><td style="color:var(--text-secondary);padding-right:12px">${label}</td>` +
            `<td style="text-align:right;color:${valueColor};font-weight:600">${value}</td></tr>`;

          let html = `<div style="font-size:12px;font-weight:700;margin-bottom:6px">${date}</div>`;
          html += '<table style="border-collapse:collapse;font-size:12px">';
          html += row('開:', open.toLocaleString('zh-TW'));
          html += row('高:', high.toLocaleString('zh-TW'));
          html += row('低:', low.toLocaleString('zh-TW'));
          html += row('收:', close.toLocaleString('zh-TW'));
          html += row(change >= 0 ? '漲:' : '跌:', `${sign}${change.toLocaleString('zh-TW')}`, color);
          html += row('幅:', `${sign}${pct}%`, color);
          if (volume) html += row('量:', `${volume.value.toLocaleString('zh-TW')} 張`);
          html += '</table>';
          return html;
        },
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: true,
        axisLabel: { formatter: (value: string) => value.slice(5), fontSize: 11, rotate: 30 },
      },
      yAxis: [
        {
          type: 'value',
          scale: true,
          splitNumber: 4,
          axisLabel: { fontSize: 11, formatter: (value: number) => value.toLocaleString('zh-TW') },
        },
        {
          type: 'value',
          splitNumber: 2,
          max: (value: { max: number }) => value.max * 5,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisPointer: { show: false },
        },
      ],
      series: [
        {
          name: 'K 線',
          type: 'candlestick',
          data: data.map(row => [row.openPrice, row.closePrice, row.lowPrice, row.highPrice]),
          itemStyle: {
            color: BULL_COLOR,
            color0: BEAR_COLOR,
            borderColor: BULL_COLOR,
            borderColor0: BEAR_COLOR,
          },
        },
        ...maSeries,
        {
          name: '成交量',
          type: 'bar',
          yAxisIndex: 1,
          data: data.map(row => ({
            value: Math.round((row.tradeVolume ?? 0) / 1000),
            itemStyle: { color: row.closePrice >= row.openPrice ? BULL_COLOR : BEAR_COLOR },
          })),
          barMaxWidth: 8,
        },
      ],
    };
  }
}
