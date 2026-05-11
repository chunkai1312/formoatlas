import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, finalize, of, switchMap } from 'rxjs';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { TickerService } from '../../core/services/ticker.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';
import { AuthService } from '../../core/services/auth.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { LoginRequiredService } from '../../core/services/login-required.service';
import { HotStockRankRow, HotStocksResponse } from '../../core/models/hot-stocks.model';
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
  private readonly authService = inject(AuthService);
  private readonly watchlistService = inject(WatchlistService);
  private readonly loginRequired = inject(LoginRequiredService);

  readonly activeMarket = signal<'TSE' | 'OTC'>('TSE');
  readonly data = signal<HotStocksResponse>(emptyHotStocks(this.dashState.endDate(), 'TSE'));
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly watchList = this.watchlistService.watchList;
  readonly pendingWatchSymbols = signal<Set<string>>(new Set<string>());
  readonly marketLabel = computed(() => this.data().market === 'OTC' ? '上櫃' : '上市');

  constructor() {
    this.updateResearchContext();

    combineLatest([
      toObservable(this.dashState.endDate),
      toObservable(this.activeMarket),
    ])
      .pipe(
        switchMap(([date, market]) => {
          this.loading.set(true);
          this.error.set(null);
          this.data.set(emptyHotStocks(date, market));

          return this.tickerService.getHotStocks(date, market).pipe(
            catchError(() => {
              this.error.set('資料載入失敗，請稍後再試。');
              return of(emptyHotStocks(date, market));
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(data => {
        this.data.set(data);
        this.updateResearchContext();
      });

    if (this.authService.isLoggedIn()) {
      this.watchlistService.load().subscribe({ error: () => undefined });
    }
  }

  setMarket(market: 'TSE' | 'OTC') {
    this.activeMarket.set(market);
    this.updateResearchContext();
  }

  toggleWatchlist(row: HotStockRankRow) {
    if (!this.authService.isLoggedIn()) {
      this.loginRequired.open();
      return;
    }

    const symbol = row.symbol;
    if (this.pendingWatchSymbols().has(symbol)) return;

    this.setPending(symbol, true);
    const request = this.watchList().includes(symbol)
      ? this.watchlistService.remove(symbol)
      : this.watchlistService.add(symbol);

    request
      .pipe(finalize(() => this.setPending(symbol, false)))
      .subscribe({ error: () => undefined });
  }

  private setPending(symbol: string, pending: boolean) {
    const next = new Set(this.pendingWatchSymbols());
    if (pending) {
      next.add(symbol);
    } else {
      next.delete(symbol);
    }
    this.pendingWatchSymbols.set(next);
  }

  private updateResearchContext() {
    this.researchContext.setContext({
      route: 'hot-stocks',
      market: this.activeMarket(),
    });
  }
}
