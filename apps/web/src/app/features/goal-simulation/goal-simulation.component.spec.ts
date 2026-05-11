import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { of, throwError } from 'rxjs';
import { GoalSimulationService } from '../../core/services/goal-simulation.service';
import { IndicatorChartComponent } from '../dashboard/components/trend-chart/indicator-chart/indicator-chart.component';
import { GoalSimulationComponent } from './goal-simulation.component';

class MockGoalSimulationService {
  run = vi.fn((request: unknown) => {
    void request;
    return of(sampleResult());
  });
}

describe('GoalSimulationComponent', () => {
  let fixture: ComponentFixture<GoalSimulationComponent>;
  let goalSimulationService: MockGoalSimulationService;
  let routeQueryParams: Record<string, string>;

  beforeEach(async () => {
    routeQueryParams = {};
    await TestBed.configureTestingModule({
      imports: [GoalSimulationComponent],
      providers: [
        { provide: GoalSimulationService, useClass: MockGoalSimulationService },
        {
          provide: ActivatedRoute,
          useFactory: () => ({ snapshot: { queryParamMap: convertToParamMap(routeQueryParams) } }),
        },
        provideEchartsCore({ echarts }),
      ],
    })
      .overrideComponent(IndicatorChartComponent, { set: { template: '' } })
      .compileComponents();

    goalSimulationService = TestBed.inject(GoalSimulationService) as unknown as MockGoalSimulationService;
  });

  it('shows the form and submit action without requiring sign in', () => {
    createComponent();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('登入會員後可執行目標模擬');
    expect(fixture.nativeElement.textContent).toContain('過去的投資績效不代表未來的保證收益');
    expect(fixture.nativeElement.querySelector('.auth-gate')).toBeNull();
    expect(fixture.nativeElement.querySelector('.submit-button')).not.toBeNull();
  });

  it('submits the form and renders candidate results without sign in', () => {
    createComponent();
    fixture.detectChanges();

    fixture.componentInstance.runSimulation();

    expect(goalSimulationService.run).toHaveBeenCalled();
  });

  it('submits the form and renders candidate results', () => {
    createComponent();
    fixture.detectChanges();

    fixture.componentInstance.symbol = '2317';
    fixture.componentInstance.startDate = '2021-01-01';
    fixture.componentInstance.endDate = '2026-01-01';
    fixture.componentInstance.runSimulation();
    fixture.detectChanges();

    expect(goalSimulationService.run).toHaveBeenCalledWith(expect.objectContaining({
      targetAmount: 3_000_000,
      startDate: '2021-01-01',
      endDate: '2026-01-01',
      universe: { type: 'single-symbol', symbols: ['2317'] },
    }));
    const request = goalSimulationService.run.mock.calls[0]?.[0] as unknown as Record<string, unknown>;
    expect(request['candidateStrategies']).toBeUndefined();
    expect(request['strategyParams']).toBeUndefined();
    expect(fixture.nativeElement.textContent).toContain('買進持有');
    expect(fixture.nativeElement.textContent).toContain('達成率 40.00%');
    expect(fixture.nativeElement.textContent).toContain('權益總值');
    expect(fixture.nativeElement.textContent).toContain('目標差距');
    expect(fixture.nativeElement.textContent).toContain('最差區間');
    expect(fixture.nativeElement.textContent).toContain('未扣交易成本');
    expect(fixture.nativeElement.textContent).toContain('交易紀錄');
    expect(fixture.nativeElement.textContent).toContain('期初投入');
    expect(fixture.nativeElement.textContent).toContain('每月投入');
    expect(fixture.nativeElement.textContent).toContain('成交價');
    expect(fixture.nativeElement.textContent).toContain('交易後現金');
    expect(fixture.nativeElement.textContent).toContain('10,000');
    expect(fixture.nativeElement.textContent).toContain('2021-01-01 - 2026-01-01');
    expect(fixture.nativeElement.textContent).toContain('2016-05-11 - 2026-05-08');
    expect(fixture.nativeElement.textContent).not.toContain('第一版目標模擬尚未將手續費與證交稅納入權益曲線');
    expect(fixture.nativeElement.textContent).not.toContain('價格資料使用還原 OHLC');
    expect(fixture.nativeElement.textContent).not.toContain('買進持有策略警示');
    expect(fixture.nativeElement.textContent).not.toContain('SMA 短均線');
    expect(fixture.nativeElement.textContent).not.toContain('股票配置');
    expect(fixture.componentInstance.chartOption()).toBeTruthy();
  });

  it('defaults the symbol to 0050', async () => {
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.symbol).toBe('0050');
    const symbolInput = fixture.nativeElement.querySelector('input[name="symbol"]') as HTMLInputElement;
    expect(symbolInput.value).toBe('0050');
  });

  it('initializes form settings from URL query params without auto submitting', () => {
    createComponent({
      symbol: ' 006208 ',
      targetMode: 'annual-return',
      targetAnnualReturnPct: '6.5',
      horizonYears: '8',
      startDate: '2018-01-02',
      endDate: '2026-01-05',
      initialCapital: '500000',
      monthlyContribution: '12000',
    });
    fixture.detectChanges();

    expect(goalSimulationService.run).not.toHaveBeenCalled();
    expect(fixture.componentInstance.symbol).toBe('006208');
    expect(fixture.componentInstance.targetMode).toBe('annual-return');
    expect(fixture.componentInstance.targetAnnualReturnPct).toBe(6.5);
    expect(fixture.componentInstance.horizonYears).toBe(8);
    expect(fixture.componentInstance.startDate).toBe('2018-01-02');
    expect(fixture.componentInstance.endDate).toBe('2026-01-05');
    expect(fixture.componentInstance.initialCapital).toBe(500_000);
    expect(fixture.componentInstance.monthlyContribution).toBe(12_000);

    fixture.componentInstance.runSimulation();

    expect(goalSimulationService.run).toHaveBeenCalledWith(expect.objectContaining({
      targetAnnualReturnPct: 6.5,
      horizonYears: 8,
      startDate: '2018-01-02',
      endDate: '2026-01-05',
      initialCapital: 500_000,
      monthlyContribution: 12_000,
      universe: { type: 'single-symbol', symbols: ['006208'] },
    }));
  });

  it('auto submits once when URL query params include autoRun=true', () => {
    createComponent({
      symbol: '006208',
      targetMode: 'annual-return',
      targetAnnualReturnPct: '6.5',
      horizonYears: '8',
      startDate: '2018-01-02',
      endDate: '2026-01-05',
      initialCapital: '500000',
      monthlyContribution: '12000',
      autoRun: 'true',
    });
    fixture.detectChanges();

    expect(goalSimulationService.run).toHaveBeenCalledTimes(1);
    expect(goalSimulationService.run).toHaveBeenCalledWith(expect.objectContaining({
      targetAnnualReturnPct: 6.5,
      horizonYears: 8,
      startDate: '2018-01-02',
      endDate: '2026-01-05',
      initialCapital: 500_000,
      monthlyContribution: 12_000,
      universe: { type: 'single-symbol', symbols: ['006208'] },
    }));
  });

  it('does not render strategy selection controls', () => {
    createComponent();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('候選策略');
    expect(fixture.nativeElement.textContent).not.toContain('SMA 均線交叉');
    expect(fixture.nativeElement.textContent).not.toContain('現金配置');
    expect(fixture.nativeElement.textContent).not.toContain('股票配置');
  });

  it('renders API error messages', () => {
    goalSimulationService.run.mockReturnValue(throwError(() => ({ error: { message: '資料不足' } })));
    createComponent();
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('資料不足');
  });

  function createComponent(queryParams: Record<string, string> = {}) {
    routeQueryParams = queryParams;
    fixture = TestBed.createComponent(GoalSimulationComponent);
  }
});

function sampleResult() {
  return {
    universe: { type: 'single-symbol' as const, symbols: ['2330'] },
    requestedHorizonYears: 10,
    requestedRange: { startDate: '2021-01-01', endDate: '2026-01-01' },
    resolvedRange: { startDate: '2016-05-11', endDate: '2026-05-08' },
    target: { targetAmount: 20_000_000, source: 'targetAmount' as const },
    cashflow: {
      initialCapital: 1_000_000,
      monthlyContribution: 30_000,
      contributionEvents: 120,
      totalContributed: 4_600_000,
    },
    costAssumption: {
      mode: 'ignored' as const,
      feeRate: null,
      taxRate: null,
      description: '第一版目標模擬尚未將手續費與證交稅納入權益曲線，結果為未扣交易成本的歷史情境估算。',
    },
    candidates: [
      {
        strategy: 'buy-and-hold' as const,
        label: '買進持有',
        status: 'available' as const,
        goalAttainmentRate: 40,
        projectedFinalValue: 8_000_000,
        targetGap: -12_000_000,
        metrics: {
          totalReturnPct: 73.9,
          annualizedReturnPct: 5.67,
          maxDrawdownPct: -25.1,
          worstPeriod: { startDate: '2022-01-01', endDate: '2022-10-01', drawdownPct: -25.1 },
        },
        equityCurve: [
          { date: '2021-01-01', value: 1_000_000 },
          { date: '2021-02-01', value: 1_050_000 },
          { date: '2021-03-01', value: 980_000 },
        ],
        drawdownCurve: [
          { date: '2021-01-01', drawdownPct: 0 },
          { date: '2021-02-01', drawdownPct: 0 },
          { date: '2021-03-01', drawdownPct: -6.67 },
        ],
        tradeRecords: [
          {
            date: '2021-01-01',
            action: 'buy' as const,
            reason: 'initial-capital' as const,
            price: 100,
            shares: 10_000,
            amount: 1_000_000,
            cashAfter: 0,
          },
          {
            date: '2021-02-01',
            action: 'buy' as const,
            reason: 'monthly-contribution' as const,
            price: 105,
            shares: 285,
            amount: 29_925,
            cashAfter: 75,
          },
        ],
        suggestions: ['提高每月投入'],
        warnings: ['買進持有策略警示'],
      },
    ],
    warnings: ['過去的投資績效不代表未來的保證收益', '價格資料使用還原 OHLC'],
  };
}
