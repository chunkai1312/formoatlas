import { Injectable, signal } from '@angular/core';

export const GLOBAL_PROGRESS_SHOW_DELAY_MS = 120;
export const GLOBAL_PROGRESS_TICK_MS = 120;
export const GLOBAL_PROGRESS_COMPLETE_HOLD_MS = 160;
export const GLOBAL_PROGRESS_FADE_MS = 180;

export type GlobalProgressSource = 'http' | 'router' | 'lazy-route';

@Injectable({ providedIn: 'root' })
export class GlobalProgressService {
  private readonly activeTokens = new Set<number>();
  private readonly tokenSources = new Map<number, GlobalProgressSource>();
  private nextToken = 1;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly visibleState = signal(false);
  private readonly completingState = signal(false);
  private readonly progressState = signal(0);
  private readonly activeCountState = signal(0);

  readonly visible = this.visibleState.asReadonly();
  readonly completing = this.completingState.asReadonly();
  readonly progress = this.progressState.asReadonly();
  readonly activeCount = this.activeCountState.asReadonly();

  start(source: GlobalProgressSource = 'http'): number {
    const token = this.nextToken++;
    this.activeTokens.add(token);
    this.tokenSources.set(token, source);
    this.activeCountState.set(this.activeTokens.size);

    this.clearHideTimers();
    this.completingState.set(false);

    if (this.visibleState()) {
      if (this.progressState() >= 90) {
        this.progressState.set(12);
      }
      this.startTicking();
      return token;
    }

    if (!this.showTimer) {
      this.showTimer = setTimeout(() => {
        this.showTimer = null;
        if (this.activeTokens.size === 0) return;
        this.visibleState.set(true);
        this.progressState.set(8);
        this.startTicking();
      }, GLOBAL_PROGRESS_SHOW_DELAY_MS);
    }

    return token;
  }

  done(token: number): void {
    this.activeTokens.delete(token);
    this.tokenSources.delete(token);
    this.activeCountState.set(this.activeTokens.size);

    if (this.activeTokens.size > 0) return;

    this.clearShowTimer();

    if (!this.visibleState()) {
      this.stopTicking();
      this.progressState.set(0);
      this.completingState.set(false);
      return;
    }

    this.finish();
  }

  resetForTesting(): void {
    this.activeTokens.clear();
    this.tokenSources.clear();
    this.activeCountState.set(0);
    this.clearShowTimer();
    this.stopTicking();
    this.clearHideTimers();
    this.visibleState.set(false);
    this.completingState.set(false);
    this.progressState.set(0);
  }

  private startTicking(): void {
    if (this.tickTimer) return;

    this.tickTimer = setInterval(() => {
      if (this.activeTokens.size === 0 || this.completingState()) return;

      this.progressState.update((current) => {
        const increment = Math.max((90 - current) * 0.18, 0.5);
        return Math.min(90, current + increment);
      });
    }, GLOBAL_PROGRESS_TICK_MS);
  }

  private finish(): void {
    this.stopTicking();
    this.completingState.set(true);
    this.progressState.set(100);

    this.hideTimer = setTimeout(() => {
      this.visibleState.set(false);
      this.resetTimer = setTimeout(() => {
        if (this.activeTokens.size > 0) return;
        this.progressState.set(0);
        this.completingState.set(false);
      }, GLOBAL_PROGRESS_FADE_MS);
    }, GLOBAL_PROGRESS_COMPLETE_HOLD_MS);
  }

  private clearShowTimer(): void {
    if (!this.showTimer) return;
    clearTimeout(this.showTimer);
    this.showTimer = null;
  }

  private clearHideTimers(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  private stopTicking(): void {
    if (!this.tickTimer) return;
    clearInterval(this.tickTimer);
    this.tickTimer = null;
  }
}
