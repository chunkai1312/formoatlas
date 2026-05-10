import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { LoginRequiredService } from '../../core/services/login-required.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';
import { TickerService } from '../../core/services/ticker.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { IndicatorChartComponent } from '../dashboard/components/trend-chart/indicator-chart/indicator-chart.component';
import { BacktestPanelComponent } from './components/backtest-panel/backtest-panel.component';
import { StockDetailComponent } from './stock-detail.component';

class MockDashboardStateService {
  readonly selectedDate = signal('2026-04-30');
  readonly endDate = computed(() => this.selectedDate());
}

describe('StockDetailComponent', () => {
  let fixture: ComponentFixture<StockDetailComponent>;
  let tickerService: { getStockSummary: ReturnType<typeof vi.fn>; getTicker: ReturnType<typeof vi.fn> };
  let watchlistService: {
    watchList: ReturnType<typeof signal<string[]>>;
    load: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let contextService: ResearchAssistantContextService;
  let loginRequired: LoginRequiredService;
  let loggedIn: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    loggedIn = signal(true);
    tickerService = {
      getStockSummary: vi.fn(() => of(stockSummary())),
      getTicker: vi.fn(() => of(adjustedOhlc())),
    };
    watchlistService = {
      watchList: signal<string[]>([]),
      load: vi.fn(() => of([])),
      add: vi.fn((symbol: string) => {
        watchlistService.watchList.set([symbol]);
        return of([symbol]);
      }),
      remove: vi.fn(() => {
        watchlistService.watchList.set([]);
        return of([]);
      }),
    };

    await TestBed.configureTestingModule({
      imports: [StockDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ symbol: '2330' })) } },
        { provide: DashboardStateService, useClass: MockDashboardStateService },
        { provide: TickerService, useValue: tickerService },
        { provide: WatchlistService, useValue: watchlistService },
        { provide: AuthService, useValue: { isLoggedIn: computed(() => loggedIn()) } },
        provideEchartsCore({ echarts }),
        LoginRequiredService,
        ResearchAssistantContextService,
      ],
    })
      .overrideComponent(IndicatorChartComponent, {
        set: { template: '' },
      })
      .overrideComponent(BacktestPanelComponent, {
        set: { template: '<section class="mock-backtest-panel"></section>' },
      })
      .compileComponents();

    contextService = TestBed.inject(ResearchAssistantContextService);
    loginRequired = TestBed.inject(LoginRequiredService);
    fixture = TestBed.createComponent(StockDetailComponent);
    fixture.detectChanges();
  });

  it('loads stock summary and sets stock assistant context', () => {
    expect(tickerService.getStockSummary).toHaveBeenCalledWith('2330', '2026-04-30');
    expect(fixture.nativeElement.textContent).toContain('台積電');
    expect(fixture.nativeElement.textContent).toContain('選取日期 2026-04-30 無個股資料');
    expect(fixture.nativeElement.textContent).toContain('漲幅榜');
    expect(fixture.nativeElement.textContent).toContain('成交金額排行');
    expect(fixture.nativeElement.textContent).toContain('#2');
    expect(fixture.nativeElement.textContent).not.toContain('actives.byValue');
    expect(contextService.context()).toMatchObject({
      route: 'stock-detail',
      market: 'TSE',
      symbol: '2330',
    });
  });

  it('adds the current stock to watchlist', () => {
    fixture.componentInstance.toggleWatchlist();

    expect(watchlistService.add).toHaveBeenCalledWith('2330');
    expect(fixture.componentInstance.isInWatchlist()).toBe(true);
  });

  it('opens login prompt instead of mutating watchlist when signed out', () => {
    loggedIn.set(false);
    fixture.componentInstance.toggleWatchlist();

    expect(loginRequired.isOpen()).toBe(true);
    expect(watchlistService.add).not.toHaveBeenCalled();
  });

  it('requests stock-mode assistant from shortcuts', () => {
    fixture.componentInstance.useAssistantShortcut('分析這檔今日量價。');

    expect(contextService.requestedMode()).toBe('stock');
    expect(contextService.requestedQuestion()).toBe('分析這檔今日量價。');
    expect(contextService.context()).toMatchObject({ route: 'stock-detail', symbol: '2330' });
  });

  it('shows daily and weekly K-line controls with moving averages', () => {
    expect(fixture.nativeElement.textContent).toContain('日K');
    expect(fixture.nativeElement.textContent).toContain('週K');
    expect(fixture.nativeElement.textContent).toContain('原始');
    expect(fixture.nativeElement.textContent).toContain('還原');
    expect(fixture.nativeElement.textContent).toContain('MA5');

    fixture.componentInstance.setChartInterval('W');
    fixture.detectChanges();

    expect(fixture.componentInstance.chartInterval()).toBe('W');
    expect(fixture.nativeElement.textContent).toContain('2Y');
    expect(fixture.nativeElement.textContent).toContain('MA60');
  });

  it('defaults stock K-line to raw summary OHLC', () => {
    expect(fixture.componentInstance.priceBasis()).toBe('raw');
    expect(fixture.componentInstance.normalizedOhlc()[0].closePrice).toBe(905);
    expect(tickerService.getTicker).not.toHaveBeenCalled();
  });

  it('requests adjusted OHLC when switching price basis', () => {
    fixture.componentInstance.setPriceBasis('adjusted');
    fixture.detectChanges();

    expect(tickerService.getTicker).toHaveBeenCalledWith('2330', '2021-04-29', '2026-04-29', true);
    expect(fixture.componentInstance.normalizedOhlc()[0].closePrice).toBe(900);
    expect(fixture.componentInstance.priceBasis()).toBe('adjusted');
  });

  it('switches back to raw OHLC without sending adjusted query', () => {
    fixture.componentInstance.setPriceBasis('adjusted');
    fixture.componentInstance.setPriceBasis('raw');
    fixture.detectChanges();

    expect(fixture.componentInstance.priceBasis()).toBe('raw');
    expect(fixture.componentInstance.normalizedOhlc()[0].closePrice).toBe(905);
    expect(tickerService.getTicker).toHaveBeenCalledTimes(1);
  });
});

function stockSummary() {
  return {
    requestedDate: '2026-04-30',
    date: '2026-04-29',
    symbol: '2330',
    name: '台積電',
    market: 'TSE',
    exchange: 'TWSE',
    industryCode: '24',
    industryName: '半導體業',
    quote: {
      openPrice: 900,
      highPrice: 920,
      lowPrice: 890,
      closePrice: 918,
      change: 10,
      changePercent: 1.1,
      tradeVolume: 1200,
      tradeValue: 12_000_000,
      transaction: 3000,
    },
    institutional: {
      finiNet: 1000,
      sitcNet: 200,
      dealersNet: -50,
      finiConsecutiveDays: 3,
      sitcConsecutiveDays: 2,
    },
    ohlc: [
      { date: '2026-04-28', openPrice: 900, highPrice: 910, lowPrice: 890, closePrice: 905, tradeVolume: 1000, tradeValue: 10_000_000 },
      { date: '2026-04-29', openPrice: 905, highPrice: 920, lowPrice: 902, closePrice: 918, tradeVolume: 1200, tradeValue: 12_000_000 },
    ],
    context: {
      appearsInHotStocks: true,
      hotStockLists: ['movers.gainers', 'actives.byValue', 'institutional.sitcBuy'],
      hotStockRanks: [
        { key: 'movers.gainers', label: '漲幅榜', rank: 1, tone: 'positive' as const },
        { key: 'actives.byValue', label: '成交金額排行', rank: 2, tone: 'neutral' as const },
        { key: 'institutional.sitcBuy', label: '投信買超', rank: 1, tone: 'positive' as const },
      ],
      marketCap: 918_000_000,
      tradeValue: 12_000_000,
      sectorTradeValue: 100_000_000,
      sectorWeightByTradeValue: 0.12,
    },
  };
}

function adjustedOhlc() {
  return [
    { date: '2026-04-28', openPrice: 895, highPrice: 905, lowPrice: 885, closePrice: 900, tradeVolume: 1000, tradeValue: 10_000_000 },
    { date: '2026-04-29', openPrice: 900, highPrice: 915, lowPrice: 897, closePrice: 913, tradeVolume: 1200, tradeValue: 12_000_000 },
  ];
}
