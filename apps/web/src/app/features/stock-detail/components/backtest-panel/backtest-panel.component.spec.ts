import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../../../core/services/auth.service';
import { BacktestingService } from '../../../../core/services/backtesting.service';
import { LoginRequiredService } from '../../../../core/services/login-required.service';
import { IndicatorChartComponent } from '../../../dashboard/components/trend-chart/indicator-chart/indicator-chart.component';
import { BacktestPanelComponent } from './backtest-panel.component';

describe('BacktestPanelComponent', () => {
  let fixture: ComponentFixture<BacktestPanelComponent>;
  let loggedIn: ReturnType<typeof signal<boolean>>;
  let backtestingService: { run: ReturnType<typeof vi.fn> };
  let loginRequired: LoginRequiredService;

  beforeEach(async () => {
    loggedIn = signal(true);
    backtestingService = {
      run: vi.fn(() => of(backtestResult())),
    };

    await TestBed.configureTestingModule({
      imports: [BacktestPanelComponent],
      providers: [
        { provide: AuthService, useValue: { isLoggedIn: computed(() => loggedIn()) } },
        { provide: BacktestingService, useValue: backtestingService },
        LoginRequiredService,
        provideEchartsCore({ echarts }),
      ],
    })
      .overrideComponent(IndicatorChartComponent, { set: { template: '' } })
      .compileComponents();

    loginRequired = TestBed.inject(LoginRequiredService);
    fixture = TestBed.createComponent(BacktestPanelComponent);
    fixture.componentRef.setInput('symbol', '2330');
    fixture.componentRef.setInput('endDate', '2026-01-10');
    fixture.detectChanges();
  });

  it('shows login gate and opens the login prompt when signed out', () => {
    loggedIn.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('登入會員後可執行回測');
    fixture.componentInstance.runBacktest();

    expect(loginRequired.isOpen()).toBe(true);
    expect(backtestingService.run).not.toHaveBeenCalled();
  });

  it('submits a run request and renders metrics, warnings and trades', () => {
    fixture.componentInstance.strategy = 'sma-cross';
    fixture.componentInstance.shortWindow = 2;
    fixture.componentInstance.longWindow = 3;
    fixture.componentInstance.orderSize = 10;
    fixture.componentInstance.runBacktest();
    fixture.detectChanges();

    expect(backtestingService.run).toHaveBeenCalledWith(expect.objectContaining({
      symbol: '2330',
      strategy: 'sma-cross',
      endDate: '2026-01-10',
      params: { shortWindow: 2, longWindow: 3, orderSize: 10 },
    }));
    expect(fixture.nativeElement.textContent).toContain('期末權益');
    expect(fixture.nativeElement.textContent).toContain('買進持有基準');
    expect(fixture.nativeElement.textContent).toContain('不構成投資建議');
    expect(fixture.nativeElement.textContent).toContain('2026-01-04');
  });

  it('submits buy-and-hold without SMA params when selected', () => {
    fixture.componentInstance.orderSize = null;
    fixture.detectChanges();

    fixture.componentInstance.runBacktest();

    expect(backtestingService.run).toHaveBeenCalledWith(expect.objectContaining({
      symbol: '2330',
      strategy: 'buy-and-hold',
      params: undefined,
    }));
    expect(fixture.nativeElement.textContent).toContain('期初買進並持有到期末');
  });

  it('defaults to buy-and-hold strategy', () => {
    expect(fixture.componentInstance.strategy).toBe('buy-and-hold');
    expect(fixture.nativeElement.textContent).toContain('期初買進並持有到期末');
    expect(fixture.nativeElement.textContent).not.toContain('短均線');
  });

  it('keeps form parameters and shows API errors', () => {
    backtestingService.run.mockReturnValue(throwError(() => ({ error: { message: '歷史資料不足' } })));
    fixture.componentInstance.shortWindow = 5;

    fixture.componentInstance.runBacktest();
    fixture.detectChanges();

    expect(fixture.componentInstance.shortWindow).toBe(5);
    expect(fixture.nativeElement.textContent).toContain('歷史資料不足');
  });
});

function backtestResult() {
  return {
    symbol: '2330',
    strategy: 'sma-cross' as const,
    requestedRange: { startDate: '2026-01-01', endDate: '2026-01-10' },
    resolvedRange: { startDate: '2026-01-01', endDate: '2026-01-10' },
    params: {
      initialCash: 10000,
      shortWindow: 2,
      longWindow: 3,
      orderSize: 10,
      feeRate: 0,
      taxRate: 0,
      effectiveCommissionRate: 0,
      tradeOnClose: true,
    },
    metrics: {
      finalEquity: 10100,
      totalReturnPct: 1,
      annualizedReturnPct: 12,
      maxDrawdownPct: -2,
      winRatePct: 50,
      tradeCount: 1,
      buyHoldReturnPct: 3,
    },
    equityCurve: [
      { date: '2026-01-01', equity: 10000 },
      { date: '2026-01-04', equity: 10100 },
    ],
    drawdownCurve: [
      { date: '2026-01-01', drawdownPct: 0 },
      { date: '2026-01-04', drawdownPct: -1 },
    ],
    trades: [
      {
        entryDate: '2026-01-04',
        exitDate: '2026-01-08',
        entryPrice: 10,
        exitPrice: 11,
        size: 10,
        pnl: 10,
        returnPct: 10,
      },
    ],
    benchmark: {
      strategy: 'buy-and-hold' as const,
      metrics: {
        finalEquity: 10050,
        totalReturnPct: 0.5,
        annualizedReturnPct: 6,
        maxDrawdownPct: -1,
        winRatePct: 100,
        tradeCount: 1,
        buyHoldReturnPct: 0.5,
      },
      equityCurve: [
        { date: '2026-01-01', equity: 10000 },
        { date: '2026-01-04', equity: 10050 },
      ],
      drawdownCurve: [
        { date: '2026-01-01', drawdownPct: 0 },
        { date: '2026-01-04', drawdownPct: -0.5 },
      ],
      trades: [],
    },
    warnings: ['回測結果為歷史資料模擬，不構成投資建議。'],
  };
}
