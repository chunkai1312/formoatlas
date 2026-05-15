import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TickerMetadata } from '../../core/models/ticker-metadata.model';
import { TickerService } from '../../core/services/ticker.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { LoginRequiredSurfaceComponent } from '../../layout/login-required-surface/login-required-surface.component';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoginRequiredSurfaceComponent],
  templateUrl: './watchlist.component.html',
  styleUrl: './watchlist.component.scss',
})
export class WatchlistComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly tickerService = inject(TickerService);
  private readonly watchlistService = inject(WatchlistService);

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly watchList = this.watchlistService.watchList;
  readonly symbolInput = signal('');
  readonly loading = signal(false);
  readonly savingSymbol = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly metadata = signal<Record<string, TickerMetadata>>({});
  readonly normalizedInput = computed(() => this.normalizeSymbol(this.symbolInput()));
  readonly rows = computed(() => this.watchList().map(symbol => ({
    symbol,
    name: this.metadata()[symbol]?.name ?? symbol,
    market: this.metadata()[symbol]?.market,
    hasMetadata: !!this.metadata()[symbol],
  })));

  ngOnInit() {
    if (this.isLoggedIn()) {
      this.load();
    }
  }

  setSymbolInput(value: string) {
    this.symbolInput.set(value);
  }

  load() {
    if (!this.isLoggedIn()) return;
    this.loading.set(true);
    this.error.set(null);
    this.watchlistService.load()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (list) => this.loadMetadata(list),
        error: () => this.error.set('自選股載入失敗，請稍後重試。'),
      });
  }

  addSymbol() {
    const symbol = this.normalizedInput();
    if (!symbol || this.savingSymbol()) return;

    this.savingSymbol.set(symbol);
    this.error.set(null);
    this.watchlistService.add(symbol)
      .pipe(finalize(() => this.savingSymbol.set(null)))
      .subscribe({
        next: (list) => {
          this.symbolInput.set('');
          this.loadMetadata(list);
        },
        error: () => this.error.set('新增自選股失敗，請確認代號後再試一次。'),
      });
  }

  removeSymbol(symbol: string) {
    const normalized = this.normalizeSymbol(symbol);
    if (!normalized || this.savingSymbol()) return;

    this.savingSymbol.set(normalized);
    this.error.set(null);
    this.watchlistService.remove(normalized)
      .pipe(finalize(() => this.savingSymbol.set(null)))
      .subscribe({
        next: (list) => this.loadMetadata(list),
        error: () => this.error.set('移除自選股失敗，請稍後重試。'),
      });
  }

  private loadMetadata(symbols: string[]) {
    if (!symbols.length) {
      this.metadata.set({});
      return;
    }

    this.tickerService.getTickerMetadata(symbols).subscribe({
      next: (items) => {
        this.metadata.set(Object.fromEntries(items.map(item => [item.symbol, item])));
      },
      error: () => {
        this.metadata.set({});
      },
    });
  }

  private normalizeSymbol(value: string) {
    return value.trim().toUpperCase();
  }
}
