import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { HomeComponent } from './home.component';
import { BarometerLevel, BarometerResult } from '../../core/models/barometer.model';
import { HotStocksResponse } from '../../core/models/hot-stocks.model';
import { MarketStats } from '../../core/models/market-stats.model';
import { BarometerService } from '../../core/services/barometer.service';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { MarketStatsService } from '../../core/services/market-stats.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';
import { TickerService } from '../../core/services/ticker.service';

class MockDashboardStateService {
  readonly selectedDate = signal('2026-04-24');
  readonly endDate = this.selectedDate;

  setDate(date: string) {
    this.selectedDate.set(date);
  }
}

const barometer: BarometerResult = {
  date: '2026-04-24',
  level: BarometerLevel.BULL,
  weather: '晴',
  label: '偏多',
  summary: '量價與法人籌碼同步偏多。',
};

const hotStocks: HotStocksResponse = {
  date: '2026-04-24',
  market: 'TSE',
  movers: { gainers: [], losers: [] },
  actives: {
    byVolume: [],
    byValue: [
      {
        symbol: '2330',
        name: '台積電',
        date: '2026-04-24',
        market: 'TSE',
        closePrice: 900,
        change: 30,
        changePercent: 3.45,
        tradeVolume: 10000,
        tradeValue: 9000000,
        finiNet: 2000,
        sitcNet: 120,
        finiConsecutiveDays: 3,
        sitcConsecutiveDays: 1,
      },
      {
        symbol: '2454',
        name: '聯發科',
        date: '2026-04-24',
        market: 'TSE',
        closePrice: 1200,
        change: 20,
        changePercent: 1.69,
        tradeVolume: 7000,
        tradeValue: 8000000,
        finiNet: 1200,
        sitcNet: 80,
        finiConsecutiveDays: null,
        sitcConsecutiveDays: null,
      },
      {
        symbol: '2303',
        name: '聯電',
        date: '2026-04-24',
        market: 'TSE',
        closePrice: 55,
        change: -1,
        changePercent: -1.79,
        tradeVolume: 6500,
        tradeValue: 7000000,
        finiNet: -900,
        sitcNet: 30,
        finiConsecutiveDays: null,
        sitcConsecutiveDays: null,
      },
      {
        symbol: '2317',
        name: '鴻海',
        date: '2026-04-24',
        market: 'TSE',
        closePrice: 160,
        change: 3,
        changePercent: 1.91,
        tradeVolume: 6000,
        tradeValue: 6000000,
        finiNet: 600,
        sitcNet: 40,
        finiConsecutiveDays: null,
        sitcConsecutiveDays: null,
      },
      {
        symbol: '2881',
        name: '富邦金',
        date: '2026-04-24',
        market: 'TSE',
        closePrice: 84,
        change: 1,
        changePercent: 1.2,
        tradeVolume: 5500,
        tradeValue: 5000000,
        finiNet: 500,
        sitcNet: 20,
        finiConsecutiveDays: null,
        sitcConsecutiveDays: null,
      },
    ],
  },
  institutional: { finiBuy: [], finiSell: [], sitcBuy: [], sitcSell: [] },
};

const marketStats: MarketStats = {
  date: '2026-04-24',
  taiexPrice: 20345.67,
  taiexChange: 123.45,
  taiexTradeValue: 300000000000,
  finiNetBuySell: 0,
  sitcNetBuySell: 0,
  dealersNetBuySell: 0,
  marginBalance: 0,
  marginBalanceChange: 0,
  shortBalance: 0,
  shortBalanceChange: 0,
  finiTxfNetOi: 0,
  finiTxoCallsNetOiValue: 0,
  finiTxoPutsNetOiValue: 0,
  finiTxoNetOiValue: 0,
  finiTxoNetOiValueChange: 0,
  topTenSpecificFrontMonthTxfNetOi: 0,
  topTenSpecificBackMonthsTxfNetOi: 0,
  retailMxfNetOi: 0,
  retailMxfLongShortRatio: 0,
  retailTmfNetOi: 0,
  retailTmfLongShortRatio: 0,
  txoPutCallRatio: 0,
  usdtwd: 0,
};

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let contextService: ResearchAssistantContextService;
  let barometerService: { getBarometer: ReturnType<typeof vi.fn> };
  let marketStatsService: { getMarketStats: ReturnType<typeof vi.fn> };
  let tickerService: {
    getSectorFlow: ReturnType<typeof vi.fn>;
    getHotStocks: ReturnType<typeof vi.fn>;
    getMarketMap: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    barometerService = {
      getBarometer: vi.fn().mockReturnValue(of(barometer)),
    };
    marketStatsService = {
      getMarketStats: vi.fn().mockReturnValue(of([marketStats])),
    };
    tickerService = {
      getSectorFlow: vi.fn().mockReturnValue(of([
        {
          symbol: 'SEMI',
          name: '半導體',
          date: '2026-04-24',
          closePrice: 120,
          change: 2,
          changePercent: 1.2,
          tradeValue: 100,
          tradeValuePrev: 90,
          tradeValueChange: 10,
          tradeWeight: 35,
          tradeWeightPrev: 32,
          tradeWeightChange: 3,
          rs: 80,
        },
        {
          symbol: 'ELEC',
          name: '電子零組件',
          date: '2026-04-24',
          closePrice: 110,
          change: 1,
          changePercent: 0.8,
          tradeValue: 90,
          tradeValuePrev: 86,
          tradeValueChange: 4,
          tradeWeight: 21,
          tradeWeightPrev: 19,
          tradeWeightChange: 2,
          rs: 76,
        },
        {
          symbol: 'COMP',
          name: '電腦及週邊設備',
          date: '2026-04-24',
          closePrice: 98,
          change: 1,
          changePercent: 0.5,
          tradeValue: 80,
          tradeValuePrev: 79,
          tradeValueChange: 1,
          tradeWeight: 8,
          tradeWeightPrev: 7,
          tradeWeightChange: 1,
          rs: 70,
        },
        {
          symbol: 'FIN',
          name: '金融保險',
          date: '2026-04-24',
          closePrice: 75,
          change: -1,
          changePercent: -0.4,
          tradeValue: 70,
          tradeValuePrev: 70,
          tradeValueChange: 0,
          tradeWeight: 6,
          tradeWeightPrev: 5.5,
          tradeWeightChange: 0.5,
          rs: 62,
        },
        {
          symbol: 'SHIP',
          name: '航運業',
          date: '2026-04-24',
          closePrice: 68,
          change: 0.5,
          changePercent: 0.3,
          tradeValue: 60,
          tradeValuePrev: 59,
          tradeValueChange: 1,
          tradeWeight: 5,
          tradeWeightPrev: 4.8,
          tradeWeightChange: 0.2,
          rs: 58,
        },
      ])),
      getHotStocks: vi.fn().mockReturnValue(of(hotStocks)),
      getMarketMap: vi.fn().mockReturnValue(of({
        date: '2026-04-24',
        market: 'TSE',
        sectors: [],
      })),
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardStateService, useClass: MockDashboardStateService },
        { provide: BarometerService, useValue: barometerService },
        { provide: MarketStatsService, useValue: marketStatsService },
        { provide: TickerService, useValue: tickerService },
        ResearchAssistantContextService,
      ],
    }).compileComponents();

    contextService = TestBed.inject(ResearchAssistantContextService);
  });

  it('renders the market snapshot and sets the home context', async () => {
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(contextService.context()).toEqual({ route: 'home' });
    expect(text).toContain('市場快照');
    expect(text).toContain('今日市場摘要');
    expect(text).toContain('大盤氣候');
    expect(text).toContain('加權指數');
    expect(text).toContain('20,345.67');
    expect(text).toContain('+123.45');
    expect(text).toContain('成交金額');
    expect(text).toContain('3,000 億');
    expect(text).toContain('資金移動');
    expect(text).toContain('個股焦點');
    expect(text).toContain('偏多');
    expect(text).toContain('大盤偏多');
    expect(text).toContain('市場溫度與整體狀態');
    expect(text).toContain('產業成交比重與變化');
    expect(text).toContain('成交比重');
    expect(text).toContain('35.00%');
    expect(text).toContain('+3.00%');
    expect(text).toContain('成交值排行與漲跌幅');
    expect(text).toContain('成交值');
    expect(text).toContain('0.1 億');
    expect(text).toContain('半導體');
    expect(text).toContain('台積電');
    expect(text).toContain('金融保險');
    expect(text).toContain('航運業');
    expect(text).toContain('鴻海');
    expect(text).toContain('富邦金');
    expect(text).not.toContain('先判斷');
    expect(text).not.toContain('觀察資金');
    expect(text).not.toContain('把盤面線索');
    expect(text).not.toContain('量價與法人籌碼同步偏多。');
    expect(text).not.toContain('pct');
    expect(fixture.nativeElement.querySelector('.step')).toBeNull();
    expect(fixture.nativeElement.querySelector('.weather-metric .metric-caption')).toBeNull();
    expect(fixture.nativeElement.querySelector('.market-climate > .weather-metric')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.snapshot-table-row')).toHaveLength(10);
  });

  it('shows a fallback for a failed panel without blocking other panels', async () => {
    tickerService.getSectorFlow.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('資料載入失敗 (500)');
    expect(text).toContain('偏多');
    expect(text).toContain('台積電');
  });

  it('keeps the market summary neutral when all data is unavailable', async () => {
    barometerService.getBarometer.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );
    marketStatsService.getMarketStats.mockReturnValueOnce(of([]));
    tickerService.getSectorFlow.mockReturnValueOnce(of([]));
    tickerService.getHotStocks.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );

    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('資料不足');
    expect(text).toContain('暫不產生市場結論');
  });
});
