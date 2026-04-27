import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { App } from './app';
import { ThemeService } from './core/services/theme.service';

class MockThemeService {
  readonly isDark = signal(false);
  toggle() {
    this.isDark.update((value) => !value);
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ThemeService, useClass: MockThemeService },
      ],
    }).compileComponents();
  });

  it('should create the app shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
