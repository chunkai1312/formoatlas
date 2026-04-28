import {
  Component,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, switchMap, catchError, of, takeUntil, map } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { DateTime } from 'luxon';

import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { BarometerService } from '../../core/services/barometer.service';
import { MarketStatsService } from '../../core/services/market-stats.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';
import { BarometerResult } from '../../core/models/barometer.model';
import { MarketStats } from '../../core/models/market-stats.model';

import { BarometerHeroComponent } from './components/barometer-hero/barometer-hero.component';
import { StatsOverviewComponent } from './components/stats-overview/stats-overview.component';
import { ChartTabGroupComponent } from './components/trend-chart/chart-tab-group/chart-tab-group.component';
import { KlineChartComponent } from './components/kline-chart/kline-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BarometerHeroComponent,
    KlineChartComponent,
    StatsOverviewComponent,
    ChartTabGroupComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnDestroy {
  private state = inject(DashboardStateService);
  private barometerService = inject(BarometerService);
  private marketStatsService = inject(MarketStatsService);
  private researchContext = inject(ResearchAssistantContextService);
  private destroy$ = new Subject<void>();

  readonly barometerData = signal<BarometerResult | null>(null);
  readonly barometerLoading = signal<boolean>(false);
  readonly barometerError = signal<string | null>(null);

  readonly marketStatsData = signal<MarketStats[]>([]);
  readonly todayStats = signal<MarketStats | null>(null);
  readonly marketStatsLoading = signal<boolean>(false);

  constructor() {
    this.researchContext.setContext({ route: 'market-overview' });

    // 監聽日期變化 → 重新載入晴雨表（toObservable 必須在 injection context 內）
    toObservable(this.state.selectedDate)
      .pipe(
        switchMap((date) => {
          this.barometerLoading.set(true);
          this.barometerError.set(null);
          this.barometerData.set(null);
          return this.barometerService.getBarometer(date).pipe(
            catchError((err: HttpErrorResponse) => {
              const msg = err.status === 404
                ? '此日期無市場資料'
                : `載入失敗 (${err.status})`;
              this.barometerError.set(msg);
              return of(null);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((result) => {
        this.barometerLoading.set(false);
        this.barometerData.set(result);
      });

    // 監聽日期變化 → 重新載入市場數據（固定手1Y）
    toObservable(this.state.selectedDate)
      .pipe(
        switchMap((date) => {
          this.marketStatsLoading.set(true);
          const start = DateTime.fromISO(date).minus({ months: 12 }).toISODate() ?? '';
          return this.marketStatsService.getMarketStats(start, date).pipe(
            map(data => ({ date, data })),
            catchError(() => of({ date, data: [] as MarketStats[] }))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(({ date, data }) => {
        this.marketStatsLoading.set(false);
        const last = data.length > 0 ? data[data.length - 1] : null;
        const hasToday = last?.date === date;
        this.marketStatsData.set(hasToday ? data : []);
        this.todayStats.set(hasToday ? last : null);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
