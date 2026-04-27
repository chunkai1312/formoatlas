import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
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
});
