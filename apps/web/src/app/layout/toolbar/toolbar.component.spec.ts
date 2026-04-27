import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ToolbarComponent } from './toolbar.component';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { ThemeService } from '../../core/services/theme.service';

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
        ]),
        { provide: DashboardStateService, useClass: MockDashboardStateService },
        { provide: ThemeService, useClass: MockThemeService },
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
});
