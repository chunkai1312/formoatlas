import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { LoginRequiredService } from '../../core/services/login-required.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';
import { TickerService } from '../../core/services/ticker.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { HotStockRankRow, HotStocksResponse } from '../../core/models/hot-stocks.model';
import { HotStocksComponent } from './hot-stocks.component';

class MockDashboardStateService {
  readonly selectedDate = signal('2026-04-24');
  readonly endDate = this.selectedDate;
}

class MockAuthService {
  readonly currentUser = signal<null | { sub: string; email: string; name: string; picture: string }>({
    sub: 'u1',
    email: 'u1@example.com',
    name: 'User',
    picture: '',
  });
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
}

class MockWatchlistService {
  readonly watchList = signal<string[]>([]);
  readonly isPanelOpen = signal(false);
  load = vi.fn(() => of([]));
  add = vi.fn((symbol: string) => {
    this.watchList.set([...this.watchList(), symbol]);
    return of(this.watchList());
  });
  remove = vi.fn((symbol: string) => {
    this.watchList.set(this.watchList().filter((item) => item !== symbol));
    return of(this.watchList());
  });
}

class MockLoginRequiredService {
  readonly isOpen = signal(false);
  open = vi.fn(() => this.isOpen.set(true));
  close = vi.fn(() => this.isOpen.set(false));
}

const row: HotStockRankRow = {
  symbol: '2330',
  name: '台積電',
  date: '2026-04-24',
  market: 'TSE',
  closePrice: 100,
  change: 1,
  changePercent: 1,
  tradeVolume: 1_000,
  tradeValue: 100_000_000,
  finiNet: 1_000,
  sitcNet: null,
  finiConsecutiveDays: null,
  sitcConsecutiveDays: null,
};

const response: HotStocksResponse = {
  date: '2026-04-24',
  market: 'TSE',
  movers: { gainers: [row], losers: [] },
  actives: { byVolume: [], byValue: [] },
  institutional: { finiBuy: [], finiSell: [], sitcBuy: [], sitcSell: [] },
};

describe('HotStocksComponent watch list toggles', () => {
  let fixture: ComponentFixture<HotStocksComponent>;
  let authService: MockAuthService;
  let watchlistService: MockWatchlistService;
  let loginRequired: MockLoginRequiredService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotStocksComponent],
      providers: [
        { provide: DashboardStateService, useClass: MockDashboardStateService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: WatchlistService, useClass: MockWatchlistService },
        { provide: LoginRequiredService, useClass: MockLoginRequiredService },
        {
          provide: TickerService,
          useValue: {
            getHotStocks: vi.fn().mockReturnValue(of(response)),
          },
        },
        ResearchAssistantContextService,
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    watchlistService = TestBed.inject(WatchlistService) as unknown as MockWatchlistService;
    loginRequired = TestBed.inject(LoginRequiredService) as unknown as MockLoginRequiredService;
    fixture = TestBed.createComponent(HotStocksComponent);
    fixture.detectChanges();
  });

  it('loads watch list state for signed-in users', () => {
    expect(watchlistService.load).toHaveBeenCalled();
  });

  it('adds and removes symbols through quick toggle', () => {
    const component = fixture.componentInstance;

    component.toggleWatchlist(row);
    expect(watchlistService.add).toHaveBeenCalledWith('2330');
    expect(watchlistService.watchList()).toEqual(['2330']);

    component.toggleWatchlist(row);
    expect(watchlistService.remove).toHaveBeenCalledWith('2330');
    expect(watchlistService.watchList()).toEqual([]);
  });

  it('opens login-required surface for signed-out users without calling add', () => {
    authService.currentUser.set(null);

    fixture.componentInstance.toggleWatchlist(row);

    expect(loginRequired.open).toHaveBeenCalled();
    expect(watchlistService.add).not.toHaveBeenCalled();
  });

  it('prevents duplicate requests while a symbol is in flight', () => {
    const pending = new Subject<string[]>();
    watchlistService.add = vi.fn(() => pending.asObservable());

    fixture.componentInstance.toggleWatchlist(row);
    fixture.componentInstance.toggleWatchlist(row);

    expect(watchlistService.add).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.pendingWatchSymbols().has('2330')).toBe(true);
    pending.next(['2330']);
    pending.complete();
    expect(fixture.componentInstance.pendingWatchSymbols().has('2330')).toBe(false);
  });
});
