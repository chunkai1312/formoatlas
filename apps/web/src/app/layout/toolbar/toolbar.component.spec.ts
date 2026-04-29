import { Component, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ToolbarComponent } from './toolbar.component';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequiredService } from '../../core/services/login-required.service';

@Component({
  standalone: true,
  template: '',
})
class EmptyRouteComponent {}

class MockDashboardStateService {
  readonly selectedDate = signal('2026-04-24');

  setDate(date: string) {
    this.selectedDate.set(date);
  }
}

class MockThemeService {
  readonly isDark = signal(false);
  toggle() {
    this.isDark.update((value) => !value);
  }
}

class MockAuthService {
  readonly currentUser = signal<null | { sub: string; email: string; name: string; picture: string }>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  login = vi.fn();
  logout = vi.fn();
}

class MockLoginRequiredService {
  readonly isOpen = signal(false);
  open = vi.fn(() => this.isOpen.set(true));
  close = vi.fn(() => this.isOpen.set(false));
}

describe('ToolbarComponent', () => {
  let fixture: ComponentFixture<ToolbarComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarComponent],
      providers: [
        provideRouter([
          { path: '', component: EmptyRouteComponent },
          { path: 'market-overview', component: EmptyRouteComponent },
          { path: 'sector-flow', component: EmptyRouteComponent },
          { path: 'hot-stocks', component: EmptyRouteComponent },
          { path: 'watchlist', component: EmptyRouteComponent },
        ]),
        { provide: DashboardStateService, useClass: MockDashboardStateService },
        { provide: ThemeService, useClass: MockThemeService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: LoginRequiredService, useClass: MockLoginRequiredService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ToolbarComponent);
  });

  it('links the brand area to the home page', async () => {
    await router.navigateByUrl('/market-overview');
    fixture.detectChanges();

    const brand = fixture.nativeElement.querySelector('.brand-link') as HTMLAnchorElement;

    expect(brand.getAttribute('href')).toBe('/');
    expect(brand.textContent).toContain('FormoAtlas');
  });

  it('keeps feature nav inactive on home and activates the matching feature route', async () => {
    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();

    let links = Array.from(
      fixture.nativeElement.querySelectorAll('.nav-link')
    ) as HTMLAnchorElement[];

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      '大盤總覽',
      '資金流向',
      '熱門個股',
      '自選股',
    ]);
    expect(links.some((link) => link.classList.contains('active'))).toBe(false);

    await router.navigateByUrl('/market-overview');
    fixture.detectChanges();
    await fixture.whenStable();
    links = Array.from(fixture.nativeElement.querySelectorAll('.nav-link')) as HTMLAnchorElement[];

    expect(links[0].classList.contains('active')).toBe(true);

    await router.navigateByUrl('/sector-flow');
    fixture.detectChanges();
    await fixture.whenStable();
    links = Array.from(fixture.nativeElement.querySelectorAll('.nav-link')) as HTMLAnchorElement[];

    expect(links[1].classList.contains('active')).toBe(true);

    await router.navigateByUrl('/hot-stocks');
    fixture.detectChanges();
    await fixture.whenStable();
    links = Array.from(fixture.nativeElement.querySelectorAll('.nav-link')) as HTMLAnchorElement[];

    expect(links[2].classList.contains('active')).toBe(true);
  });

  it('opens the login-required prompt instead of navigating to watchlist when signed out', () => {
    fixture.detectChanges();
    const loginRequired = TestBed.inject(LoginRequiredService) as unknown as MockLoginRequiredService;
    const links = Array.from(fixture.nativeElement.querySelectorAll('.nav-link')) as HTMLElement[];

    links[3].click();

    expect(loginRequired.open).toHaveBeenCalled();
  });

  it('activates the watchlist nav item for signed-in users on /watchlist', async () => {
    const authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    authService.currentUser.set({
      sub: 'u1',
      email: 'u1@example.com',
      name: 'User',
      picture: '',
    });

    await router.navigateByUrl('/watchlist');
    fixture.detectChanges();
    await fixture.whenStable();

    const links = Array.from(fixture.nativeElement.querySelectorAll('.nav-link')) as HTMLElement[];
    expect(links[3].textContent?.trim()).toBe('自選股');
    expect(links[3].classList.contains('active')).toBe(true);
  });
});
