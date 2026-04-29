import { TestBed } from '@angular/core/testing';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Route,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
} from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { GlobalProgressService } from './global-progress.service';
import { GlobalProgressRouterTrackerService } from './global-progress-router-tracker.service';

class MockGlobalProgressService {
  private nextToken = 1;
  start = vi.fn(() => this.nextToken++);
  done = vi.fn();
}

describe('GlobalProgressRouterTrackerService', () => {
  let events: Subject<unknown>;
  let tracker: GlobalProgressRouterTrackerService;
  let progress: MockGlobalProgressService;

  beforeEach(() => {
    events = new Subject<unknown>();

    TestBed.configureTestingModule({
      providers: [
        GlobalProgressRouterTrackerService,
        { provide: Router, useValue: { events: events.asObservable() } },
        { provide: GlobalProgressService, useClass: MockGlobalProgressService },
      ],
    });

    tracker = TestBed.inject(GlobalProgressRouterTrackerService);
    progress = TestBed.inject(GlobalProgressService) as unknown as MockGlobalProgressService;
  });

  afterEach(() => {
    tracker.stopForTesting();
    events.complete();
  });

  it('tracks navigation start and end', () => {
    tracker.start();

    events.next(new NavigationStart(1, '/market-overview'));
    expect(progress.start).toHaveBeenCalledWith('router');

    events.next(new NavigationEnd(1, '/market-overview', '/market-overview'));
    expect(progress.done).toHaveBeenCalledWith(1);
  });

  it('ends navigation activity on cancel and error', () => {
    tracker.start();

    events.next(new NavigationStart(1, '/market-overview'));
    events.next(new NavigationCancel(1, '/market-overview', 'cancelled'));
    events.next(new NavigationStart(2, '/sector-flow'));
    events.next(new NavigationError(2, '/sector-flow', new Error('failed')));

    expect(progress.done).toHaveBeenCalledWith(1);
    expect(progress.done).toHaveBeenCalledWith(2);
  });

  it('tracks lazy route loading', () => {
    const route = { path: 'lazy' } as Route;
    tracker.start();

    events.next(new RouteConfigLoadStart(route));
    expect(progress.start).toHaveBeenCalledWith('lazy-route');

    events.next(new RouteConfigLoadEnd(route));
    expect(progress.done).toHaveBeenCalledWith(1);
  });
});
