import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
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
  readonly dateReady = signal(false);
  setDate(date: string) { this.selectedDate.set(date); }
  setDateReady() { this.dateReady.set(true); }
}

async function setup() {
  await TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      { provide: ThemeService, useClass: MockThemeService },
      { provide: DashboardStateService, useClass: MockDashboardStateService },
    ],
  }).compileComponents();
}

describe('App', () => {
  afterEach(() => {
    history.replaceState(null, '', '/');
  });

  it('should create the app shell', async () => {
    await setup();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should gate on /trading-date when no ?date= in URL', async () => {
    await setup();
    const tradingDateService = TestBed.inject(TradingDateService);
    vi.spyOn(tradingDateService, 'getLatestTradingDate').mockReturnValue(of({ date: '2026-04-25' }));
    const stateService = TestBed.inject(DashboardStateService);
    const setDateSpy = vi.spyOn(stateService, 'setDate');
    const setDateReadySpy = vi.spyOn(stateService, 'setDateReady');

    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.ngOnInit();
    await fixture.whenStable();

    expect(tradingDateService.getLatestTradingDate).toHaveBeenCalled();
    expect(setDateSpy).toHaveBeenCalledWith('2026-04-25');
    expect(setDateReadySpy).toHaveBeenCalled();
    expect(stateService.dateReady()).toBe(true);
  });

  it('should fallback to today when /trading-date returns null', async () => {
    await setup();
    const tradingDateService = TestBed.inject(TradingDateService);
    vi.spyOn(tradingDateService, 'getLatestTradingDate').mockReturnValue(
      of(null as unknown as { date: string })
    );
    const stateService = TestBed.inject(DashboardStateService);
    const setDateReadySpy = vi.spyOn(stateService, 'setDateReady');

    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.ngOnInit();
    await fixture.whenStable();

    expect(setDateReadySpy).toHaveBeenCalled();
    expect(stateService.dateReady()).toBe(true);
  });

  it('should be ready immediately without calling /trading-date when ?date= is in URL', async () => {
    history.replaceState(null, '', '/?date=2026-04-25');
    await setup();
    const tradingDateService = TestBed.inject(TradingDateService);
    const getLatestSpy = vi.spyOn(tradingDateService, 'getLatestTradingDate');
    const stateService = TestBed.inject(DashboardStateService);
    const setDateSpy = vi.spyOn(stateService, 'setDate');
    const setDateReadySpy = vi.spyOn(stateService, 'setDateReady');

    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.ngOnInit();
    await fixture.whenStable();

    expect(getLatestSpy).not.toHaveBeenCalled();
    expect(setDateSpy).toHaveBeenCalledWith('2026-04-25');
    expect(setDateReadySpy).toHaveBeenCalled();
    expect(stateService.dateReady()).toBe(true);
  });
});
