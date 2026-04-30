import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HotStockRankRow } from '../../../../core/models/hot-stocks.model';
import { HotStockRankingTableComponent } from './hot-stock-ranking-table.component';

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

describe('HotStockRankingTableComponent', () => {
  let fixture: ComponentFixture<HotStockRankingTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotStockRankingTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HotStockRankingTableComponent);
    fixture.componentRef.setInput('title', '漲幅榜');
    fixture.componentRef.setInput('rows', [row]);
    fixture.componentRef.setInput('metricLabel', '漲跌幅');
    fixture.componentRef.setInput('metricKey', 'changePercent');
  });

  it('renders selected watch state and accessible remove label', () => {
    fixture.componentRef.setInput('watchList', ['2330']);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.watch-toggle') as HTMLButtonElement;
    expect(button.classList.contains('active')).toBe(true);
    expect(button.getAttribute('aria-label')).toBe('移除 2330 台積電 自選股');
    expect(button.textContent).toContain('star');
  });

  it('emits toggle events for unselected rows', () => {
    const emitted: HotStockRankRow[] = [];
    fixture.componentInstance.watchlistToggle.subscribe((value) => emitted.push(value));
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.watch-toggle') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('加入 2330 台積電 自選股');
    button.click();

    expect(emitted).toEqual([row]);
  });

  it('renders symbol and name links to stock detail without using the watch toggle', () => {
    const emitted: HotStockRankRow[] = [];
    fixture.componentInstance.watchlistToggle.subscribe((value) => emitted.push(value));
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];

    expect(links.map(link => link.getAttribute('href'))).toEqual(['/stocks/2330', '/stocks/2330']);
    expect(emitted).toEqual([]);
  });

  it('disables duplicate toggle while a symbol is pending', () => {
    const emitted: HotStockRankRow[] = [];
    fixture.componentInstance.watchlistToggle.subscribe((value) => emitted.push(value));
    fixture.componentRef.setInput('pendingWatchSymbols', new Set(['2330']));
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.watch-toggle') as HTMLButtonElement;
    button.click();

    expect(button.disabled).toBe(true);
    expect(emitted).toEqual([]);
  });
});
