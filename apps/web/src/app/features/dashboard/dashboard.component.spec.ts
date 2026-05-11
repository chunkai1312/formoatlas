import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { BarometerService } from '../../core/services/barometer.service';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { MarketStatsService } from '../../core/services/market-stats.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';

class MockDashboardStateService {
  readonly selectedDate = signal('2026-04-24');
  readonly endDate = this.selectedDate;

  setDate(date: string) {
    this.selectedDate.set(date);
  }
}

describe('DashboardComponent', () => {
  it('sets the market overview research context', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DashboardStateService, useClass: MockDashboardStateService },
        { provide: BarometerService, useValue: { getBarometer: () => of(null) } },
        { provide: MarketStatsService, useValue: { getMarketStats: () => of([]) } },
        ResearchAssistantContextService,
      ],
    });

    const contextService = TestBed.inject(ResearchAssistantContextService);
    const component = TestBed.runInInjectionContext(() => new DashboardComponent());

    expect(contextService.context()).toEqual({ route: 'market-overview' });

    component.ngOnDestroy();
  });

  it('renders metric-card skeletons while market stats are loading', async () => {
    const pendingStats = new Subject<never[]>();

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: DashboardStateService, useClass: MockDashboardStateService },
        { provide: BarometerService, useValue: { getBarometer: () => of(null) } },
        { provide: MarketStatsService, useValue: { getMarketStats: () => pendingStats.asObservable() } },
        ResearchAssistantContextService,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(fixture.nativeElement.querySelectorAll('.stat-card-skeleton')).toHaveLength(6);
    expect(text).not.toContain('載入中...');

    pendingStats.next([]);
    pendingStats.complete();
  });
});
