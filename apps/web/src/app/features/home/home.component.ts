import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subject, catchError, of, switchMap, takeUntil } from 'rxjs';

import { BarometerResult } from '../../core/models/barometer.model';
import { HotStockRankRow, HotStocksResponse } from '../../core/models/hot-stocks.model';
import { MarketMapResponse } from '../../core/models/market-map.model';
import { MarketStats } from '../../core/models/market-stats.model';
import { SectorFlowSnapshot } from '../../core/models/sector-flow-snapshot.model';
import { BarometerService } from '../../core/services/barometer.service';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { MarketStatsService } from '../../core/services/market-stats.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';
import { TickerService } from '../../core/services/ticker.service';
import { MarketMapComponent, MarketMapSizeMode } from './market-map/market-map.component';

type PanelKey = 'barometer' | 'marketStats' | 'sectorFlow' | 'hotStocks' | 'marketMap' | 'marketMapOtc';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MarketMapComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnDestroy {
  private readonly state = inject(DashboardStateService);
  private readonly barometerService = inject(BarometerService);
  private readonly marketStatsService = inject(MarketStatsService);
  private readonly tickerService = inject(TickerService);
  private readonly researchContext = inject(ResearchAssistantContextService);
  private readonly destroy$ = new Subject<void>();

  readonly selectedDate = this.state.selectedDate;

  readonly barometer = signal<BarometerResult | null>(null);
  readonly marketStats = signal<MarketStats | null>(null);
  readonly sectorFlow = signal<SectorFlowSnapshot[]>([]);
  readonly hotStocks = signal<HotStocksResponse | null>(null);
  readonly marketMap = signal<MarketMapResponse | null>(null);
  readonly marketMapOtc = signal<MarketMapResponse | null>(null);
  readonly marketMapMarket = signal<'TSE' | 'OTC'>('TSE');
  readonly marketMapSizeMode = signal<MarketMapSizeMode>('marketCap');

  readonly loading = signal<Record<PanelKey, boolean>>({
    barometer: false,
    marketStats: false,
    sectorFlow: false,
    hotStocks: false,
    marketMap: false,
    marketMapOtc: false,
  });
  readonly errors = signal<Record<PanelKey, string | null>>({
    barometer: null,
    marketStats: null,
    sectorFlow: null,
    hotStocks: null,
    marketMap: null,
    marketMapOtc: null,
  });

  readonly topSectors = computed(() =>
    [...this.sectorFlow()]
      .sort((a, b) => b.tradeWeightChange - a.tradeWeightChange)
      .slice(0, 5)
  );

  readonly focusStocks = computed<HotStockRankRow[]>(() => {
    const data = this.hotStocks();
    if (!data) return [];

    return (data.actives.byValue ?? []).slice(0, 5);
  });

  readonly marketTone = computed(() => {
    if (this.barometer()) return this.barometer()!.label;
    if (this.anyLoading()) return '整理中';
    return '資料不足';
  });

  readonly marketSummary = computed(() => {
    const parts: string[] = [];
    const barometer = this.barometer();
    const sectors = this.topSectors();
    const stocks = this.focusStocks();

    if (barometer) {
      parts.push(`大盤${barometer.label}`);
    }

    if (sectors.length) {
      parts.push(`資金較集中於${sectors.map((sector) => sector.name).join('、')}`);
    }

    if (stocks.length) {
      parts.push(`個股焦點包含${stocks.map((stock) => stock.name).join('、')}`);
    }

    if (parts.length) {
      return `${parts.join('，')}。`;
    }

    return this.anyLoading()
      ? '資料載入中，暫不產生市場結論。'
      : '此日期資料不足，暫不產生市場結論。';
  });

  readonly marketMapSizeLabel = computed(() =>
    this.marketMapSizeMode() === 'tradeValue' ? '成交金額' : '市值'
  );

  constructor() {
    this.researchContext.setContext({ route: 'home' });
    this.loadBarometer();
    this.loadMarketStats();
    this.loadSectorFlow();
    this.loadHotStocks();
    this.loadMarketMap('TSE');
    this.loadMarketMap('OTC');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatPercent(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  formatSignedPercent(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  formatUnsignedPercent(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  formatIndex(value: number): string {
    return value.toLocaleString('zh-TW', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatIndexChange(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toLocaleString('zh-TW', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  formatTradeValue(value: number): string {
    return (value / 100_000_000).toLocaleString('zh-TW', {
      maximumFractionDigits: 1,
    });
  }

  private anyLoading(): boolean {
    const loading = this.loading();
    return loading.barometer || loading.marketStats || loading.sectorFlow || loading.hotStocks || loading.marketMap;
  }

  private loadBarometer() {
    toObservable(this.selectedDate)
      .pipe(
        switchMap((date) => {
          this.setLoading('barometer', true);
          this.setError('barometer', null);
          this.barometer.set(null);

          return this.barometerService.getBarometer(date).pipe(
            catchError((err: HttpErrorResponse) => {
              this.setError('barometer', this.errorMessage(err));
              return of(null);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((result) => {
        this.barometer.set(result);
        this.setLoading('barometer', false);
      });
  }

  private loadMarketStats() {
    toObservable(this.selectedDate)
      .pipe(
        switchMap((date) => {
          this.setLoading('marketStats', true);
          this.setError('marketStats', null);
          this.marketStats.set(null);

          return this.marketStatsService.getMarketStats(date, date).pipe(
            catchError((err: HttpErrorResponse) => {
              this.setError('marketStats', this.errorMessage(err));
              return of([] as MarketStats[]);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((result) => {
        this.marketStats.set(result.length ? result[result.length - 1] : null);
        this.setLoading('marketStats', false);
      });
  }

  private loadSectorFlow() {
    toObservable(this.selectedDate)
      .pipe(
        switchMap((date) => {
          this.setLoading('sectorFlow', true);
          this.setError('sectorFlow', null);
          this.sectorFlow.set([]);

          return this.tickerService.getSectorFlow(date, 'TSE').pipe(
            catchError((err: HttpErrorResponse) => {
              this.setError('sectorFlow', this.errorMessage(err));
              return of([] as SectorFlowSnapshot[]);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((result) => {
        this.sectorFlow.set(result);
        this.setLoading('sectorFlow', false);
      });
  }

  private loadHotStocks() {
    toObservable(this.selectedDate)
      .pipe(
        switchMap((date) => {
          this.setLoading('hotStocks', true);
          this.setError('hotStocks', null);
          this.hotStocks.set(null);

          return this.tickerService.getHotStocks(date, 'TSE').pipe(
            catchError((err: HttpErrorResponse) => {
              this.setError('hotStocks', this.errorMessage(err));
              return of(null);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((result) => {
        this.hotStocks.set(result);
        this.setLoading('hotStocks', false);
      });
  }

  private loadMarketMap(market: 'TSE' | 'OTC') {
    const key: PanelKey = market === 'OTC' ? 'marketMapOtc' : 'marketMap';
    const dataSignal = market === 'OTC' ? this.marketMapOtc : this.marketMap;

    toObservable(this.selectedDate)
      .pipe(
        switchMap((date) => {
          this.setLoading(key, true);
          this.setError(key, null);
          dataSignal.set(null);

          return this.tickerService.getMarketMap(date, market).pipe(
            catchError((err: HttpErrorResponse) => {
              this.setError(key, this.errorMessage(err));
              return of(null);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((result) => {
        dataSignal.set(result);
        this.setLoading(key, false);
      });
  }

  private errorMessage(err: HttpErrorResponse): string {
    return err.status === 404 ? '此日期暫無資料' : `資料載入失敗 (${err.status || 'unknown'})`;
  }

  private setLoading(key: PanelKey, value: boolean) {
    this.loading.update((state) => ({ ...state, [key]: value }));
  }

  private setError(key: PanelKey, value: string | null) {
    this.errors.update((state) => ({ ...state, [key]: value }));
  }
}
