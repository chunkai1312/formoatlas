import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, of, switchMap } from 'rxjs';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { TickerService } from '../../core/services/ticker.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';
import { HotStocksResponse } from '../../core/models/hot-stocks.model';
import { HotStockRankingTableComponent } from './components/hot-stock-ranking-table/hot-stock-ranking-table.component';

const emptyHotStocks = (date: string, market: 'TSE' | 'OTC'): HotStocksResponse => ({
  date,
  market,
  movers: { gainers: [], losers: [] },
  actives: { byVolume: [], byValue: [] },
  institutional: { finiBuy: [], finiSell: [], sitcBuy: [], sitcSell: [] },
});

@Component({
  selector: 'app-hot-stocks',
  standalone: true,
  imports: [CommonModule, HotStockRankingTableComponent],
  templateUrl: './hot-stocks.component.html',
  styleUrl: './hot-stocks.component.scss',
})
export class HotStocksComponent {
  private readonly dashState = inject(DashboardStateService);
  private readonly tickerService = inject(TickerService);
  private readonly researchContext = inject(ResearchAssistantContextService);

  readonly activeMarket = signal<'TSE' | 'OTC'>('TSE');
  readonly data = signal<HotStocksResponse>(emptyHotStocks(this.dashState.endDate(), 'TSE'));
  readonly marketLabel = computed(() => this.data().market === 'OTC' ? '上櫃' : '上市');

  constructor() {
    this.updateResearchContext();

    combineLatest([
      toObservable(this.dashState.endDate),
      toObservable(this.activeMarket),
    ])
      .pipe(
        switchMap(([date, market]) =>
          this.tickerService.getHotStocks(date, market).pipe(
            catchError(() => of(emptyHotStocks(date, market))),
          )
        ),
        takeUntilDestroyed(),
      )
      .subscribe(data => {
        this.data.set(data);
        this.updateResearchContext();
      });
  }

  setMarket(market: 'TSE' | 'OTC') {
    this.activeMarket.set(market);
    this.updateResearchContext();
  }

  private updateResearchContext() {
    this.researchContext.setContext({
      route: 'hot-stocks',
      market: this.activeMarket(),
    });
  }
}
