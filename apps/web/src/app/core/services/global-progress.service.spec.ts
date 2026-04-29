import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  GLOBAL_PROGRESS_COMPLETE_HOLD_MS,
  GLOBAL_PROGRESS_FADE_MS,
  GLOBAL_PROGRESS_SHOW_DELAY_MS,
  GLOBAL_PROGRESS_TICK_MS,
  GlobalProgressService,
} from './global-progress.service';

describe('GlobalProgressService', () => {
  let service: GlobalProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GlobalProgressService],
    });

    service = TestBed.inject(GlobalProgressService);
  });

  afterEach(() => {
    service.resetForTesting();
    vi.useRealTimers();
  });

  it('does not show the bar for activities that finish before the delay', () => {
    vi.useFakeTimers();
    const token = service.start('http');

    vi.advanceTimersByTime(GLOBAL_PROGRESS_SHOW_DELAY_MS - 1);
    service.done(token);
    vi.advanceTimersByTime(GLOBAL_PROGRESS_SHOW_DELAY_MS + GLOBAL_PROGRESS_COMPLETE_HOLD_MS + GLOBAL_PROGRESS_FADE_MS);

    expect(service.visible()).toBe(false);
    expect(service.progress()).toBe(0);
    expect(service.activeCount()).toBe(0);
  });

  it('keeps the bar active until all concurrent activities finish', () => {
    vi.useFakeTimers();
    const first = service.start('http');
    const second = service.start('router');

    vi.advanceTimersByTime(GLOBAL_PROGRESS_SHOW_DELAY_MS);
    expect(service.visible()).toBe(true);
    expect(service.activeCount()).toBe(2);

    service.done(first);
    expect(service.visible()).toBe(true);
    expect(service.activeCount()).toBe(1);

    service.done(second);
    expect(service.completing()).toBe(true);
    expect(service.progress()).toBe(100);

    vi.advanceTimersByTime(GLOBAL_PROGRESS_COMPLETE_HOLD_MS);
    expect(service.visible()).toBe(false);

    vi.advanceTimersByTime(GLOBAL_PROGRESS_FADE_MS);
    expect(service.completing()).toBe(false);
    expect(service.progress()).toBe(0);
  });

  it('advances visible activities with pseudo progress', () => {
    vi.useFakeTimers();
    service.start('http');

    vi.advanceTimersByTime(GLOBAL_PROGRESS_SHOW_DELAY_MS);
    const initial = service.progress();
    vi.advanceTimersByTime(GLOBAL_PROGRESS_TICK_MS);

    expect(service.progress()).toBeGreaterThan(initial);
    expect(service.progress()).toBeLessThanOrEqual(90);
  });

  it('cancels fade-out when a new activity starts', () => {
    vi.useFakeTimers();
    const first = service.start('http');
    vi.advanceTimersByTime(GLOBAL_PROGRESS_SHOW_DELAY_MS);

    service.done(first);
    expect(service.completing()).toBe(true);
    expect(service.progress()).toBe(100);

    service.start('router');
    expect(service.visible()).toBe(true);
    expect(service.completing()).toBe(false);
    expect(service.progress()).toBe(12);

    vi.advanceTimersByTime(GLOBAL_PROGRESS_COMPLETE_HOLD_MS + GLOBAL_PROGRESS_FADE_MS);
    expect(service.visible()).toBe(true);
    expect(service.activeCount()).toBe(1);
  });
});
