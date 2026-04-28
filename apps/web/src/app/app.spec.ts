import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { App } from './app';
import { ThemeService } from './core/services/theme.service';
import { TradingDateService } from './core/services/trading-date.service';
import { DashboardStateService } from './core/services/dashboard-state.service';

class MockThemeService {
  readonly isDark = signal(false);
  toggle() {
    this.isDark.update((value) => !value);
  }
}

class MockDashboardStateService {
  readonly selectedDate = signal('2026-04-28');
  readonly endDate = this.selectedDate;
  setDate(date: string) { this.selectedDate.set(date); }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ThemeService, useClass: MockThemeService },
        { provide: DashboardStateService, useClass: MockDashboardStateService },
      ],
    }).compileComponents();
  });

  it('should create the app shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not show banner when today has trading data', async () => {
    const tradingDateService = TestBed.inject(TradingDateService);
    const today = new Date().toISOString().slice(0, 10);
    spyOn(tradingDateService, 'getLatestTradingDate').and.returnValue(of({ date: today }));

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.non-trading-day-banner');
    expect(banner).toBeNull();
  });

  it('should show banner when today has no trading data', async () => {
    const tradingDateService = TestBed.inject(TradingDateService);
    spyOn(tradingDateService, 'getLatestTradingDate').and.returnValue(of({ date: '2026-04-25' }));

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.non-trading-day-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('今日行情尚未更新');
  });
});
