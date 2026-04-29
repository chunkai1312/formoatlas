import { Injectable, inject } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
} from '@angular/router';
import { Subscription } from 'rxjs';
import { GlobalProgressService } from './global-progress.service';

@Injectable({ providedIn: 'root' })
export class GlobalProgressRouterTrackerService {
  private readonly router = inject(Router);
  private readonly progress = inject(GlobalProgressService);
  private subscription: Subscription | null = null;
  private navigationToken: number | null = null;
  private readonly lazyRouteTokens: number[] = [];

  start(): void {
    if (this.subscription) return;

    this.subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.finishNavigation();
        this.navigationToken = this.progress.start('router');
        return;
      }

      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.finishNavigation();
        return;
      }

      if (event instanceof RouteConfigLoadStart) {
        this.lazyRouteTokens.push(this.progress.start('lazy-route'));
        return;
      }

      if (event instanceof RouteConfigLoadEnd) {
        const token = this.lazyRouteTokens.shift();
        if (token !== undefined) {
          this.progress.done(token);
        }
      }
    });
  }

  stopForTesting(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.finishNavigation();

    while (this.lazyRouteTokens.length) {
      const token = this.lazyRouteTokens.shift();
      if (token !== undefined) this.progress.done(token);
    }
  }

  private finishNavigation(): void {
    if (this.navigationToken === null) return;
    this.progress.done(this.navigationToken);
    this.navigationToken = null;
  }
}
