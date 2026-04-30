import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { TickerService } from '../../core/services/ticker.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { WatchlistComponent } from './watchlist.component';

class MockAuthService {
  readonly currentUser = signal<null | { sub: string; email: string; name: string; picture: string }>({
    sub: 'u1',
    email: 'u1@example.com',
    name: 'User',
    picture: '',
  });
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  login = vi.fn();
}

class MockWatchlistService {
  readonly watchList = signal<string[]>([]);
  readonly isPanelOpen = signal(false);
  load = vi.fn(() => {
    this.watchList.set(['2330', '2317']);
    return of(this.watchList());
  });
  add = vi.fn((symbol: string) => {
    this.watchList.set([...this.watchList(), symbol]);
    return of(this.watchList());
  });
  remove = vi.fn((symbol: string) => {
    this.watchList.set(this.watchList().filter((item) => item !== symbol));
    return of(this.watchList());
  });
}

class MockTickerService {
  getTickerMetadata = vi.fn(() => of([
    { symbol: '2330', name: '台積電', market: 'TSE' },
    { symbol: '2317', name: '鴻海', market: 'TSE' },
  ]));
}

describe('WatchlistComponent', () => {
  let fixture: ComponentFixture<WatchlistComponent>;
  let watchlistService: MockWatchlistService;
  let tickerService: MockTickerService;
  let authService: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WatchlistComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: MockAuthService },
        { provide: TickerService, useClass: MockTickerService },
        { provide: WatchlistService, useClass: MockWatchlistService },
      ],
    }).compileComponents();

    watchlistService = TestBed.inject(WatchlistService) as unknown as MockWatchlistService;
    tickerService = TestBed.inject(TickerService) as unknown as MockTickerService;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
  });

  function create() {
    fixture = TestBed.createComponent(WatchlistComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('loads and renders the signed-in user watch list', () => {
    create();

    expect(watchlistService.load).toHaveBeenCalled();
    expect(tickerService.getTickerMetadata).toHaveBeenCalledWith(['2330', '2317']);
    expect(fixture.nativeElement.textContent).toContain('2 檔追蹤中');
    expect(fixture.nativeElement.textContent).toContain('台積電');
    expect(fixture.nativeElement.textContent).toContain('鴻海');
    expect(fixture.nativeElement.textContent).toContain('2330');
    expect(fixture.nativeElement.textContent).toContain('2317');
    const stockLinks = Array.from(fixture.nativeElement.querySelectorAll('.symbol-cell a')) as HTMLAnchorElement[];
    expect(stockLinks.map(link => link.getAttribute('href'))).toEqual(['/stocks/2330', '/stocks/2317']);
  });

  it('falls back to symbol display when metadata lookup fails', () => {
    tickerService.getTickerMetadata = vi.fn(() => throwError(() => new Error('metadata failed')));
    create();

    const cells = Array.from(fixture.nativeElement.querySelectorAll('.symbol-cell')) as HTMLElement[];
    expect(fixture.nativeElement.textContent).toContain('2330');
    expect(fixture.nativeElement.textContent).toContain('2317');
    expect(cells.map(cell => cell.textContent?.trim())).toEqual(['23302330', '23172317']);
  });

  it('renders empty state with add input and hot stocks link', () => {
    watchlistService.load = vi.fn(() => of([]));
    create();
    watchlistService.watchList.set([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('尚未建立自選股');
    expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
    expect((fixture.nativeElement.querySelector('a') as HTMLAnchorElement).getAttribute('href')).toBe('/hot-stocks');
  });

  it('normalizes input before adding a symbol', () => {
    const component = create();
    component.setSymbolInput('  abcd ');
    component.addSymbol();

    expect(watchlistService.add).toHaveBeenCalledWith('ABCD');
    expect(component.symbolInput()).toBe('');
  });

  it('removes a symbol from the list', () => {
    const component = create();
    component.removeSymbol('2330');

    expect(watchlistService.remove).toHaveBeenCalledWith('2330');
    expect(watchlistService.watchList()).toEqual(['2317']);
  });

  it('shows a recoverable error when loading fails', () => {
    watchlistService.load = vi.fn(() => throwError(() => new Error('fail')));
    create();

    expect(fixture.nativeElement.textContent).toContain('自選股載入失敗');
    expect(fixture.nativeElement.textContent).toContain('重新載入');
  });

  it('does not load watch list data when signed out', () => {
    authService.currentUser.set(null);
    create();

    expect(watchlistService.load).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('需要登入才能使用自選股');
  });
});
