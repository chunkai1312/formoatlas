import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  GLOBAL_PROGRESS_SHOW_DELAY_MS,
  GlobalProgressService,
} from '../../core/services/global-progress.service';
import { GlobalProgressBarComponent } from './global-progress-bar.component';

describe('GlobalProgressBarComponent', () => {
  let progress: GlobalProgressService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalProgressBarComponent],
      providers: [GlobalProgressService],
    }).compileComponents();

    progress = TestBed.inject(GlobalProgressService);
  });

  afterEach(() => {
    progress.resetForTesting();
    vi.useRealTimers();
  });

  it('renders a fixed top progress bar without layout content', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(GlobalProgressBarComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('.global-progress') as HTMLElement;
    const bar = fixture.nativeElement.querySelector('.global-progress__bar') as HTMLElement;

    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.classList.contains('is-visible')).toBe(false);

    progress.start('http');
    vi.advanceTimersByTime(GLOBAL_PROGRESS_SHOW_DELAY_MS);
    fixture.detectChanges();

    expect(host.classList.contains('is-visible')).toBe(true);
    expect(bar.style.transform).toBe('scaleX(0.08)');
  });
});
