import {
  Component,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DateTime } from 'luxon';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { MenuModule } from 'primeng/menu';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequiredService } from '../../core/services/login-required.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    DatePickerModule,
    MenuModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  private state = inject(DashboardStateService);
  readonly themeService = inject(ThemeService);
  readonly authService = inject(AuthService);
  private readonly loginRequired = inject(LoginRequiredService);
  readonly isDark = this.themeService.isDark;
  readonly currentUser = this.authService.currentUser;
  readonly isLoggedIn = this.authService.isLoggedIn;

  readonly selectedDateObj = computed(() =>
    new Date(this.state.selectedDate() + 'T00:00:00')
  );

  readonly selectedDateStr = computed(() => {
    const d = this.state.selectedDate();
    return d ? d.substring(0, 10) : '';
  });

  readonly maxDate = new Date();

  readonly userMenuItems = computed<MenuItem[]>(() => {
    const user = this.currentUser();
    return [
      {
        label: user?.name ?? '使用者',
        disabled: true,
        styleClass: 'user-menu-name',
      },
      {
        label: user?.email ?? '',
        disabled: true,
        styleClass: 'user-menu-email',
      },
      { separator: true },
      {
        label: '登出',
        icon: 'pi pi-sign-out',
        command: () => this.logout(),
      },
    ];
  });

  readonly isToday = computed(() => {
    return this.state.selectedDate() === (DateTime.local().toISODate() ?? '');
  });

  prevDay() {
    const d = DateTime.fromISO(this.state.selectedDate()).minus({ days: 1 });
    this.state.setDate(d.toISODate() ?? '');
  }

  nextDay() {
    if (this.isToday()) return;
    const d = DateTime.fromISO(this.state.selectedDate()).plus({ days: 1 });
    this.state.setDate(d.toISODate() ?? '');
  }

  onDatePickerChange(date: Date | null) {
    if (!date) return;
    this.state.setDate(DateTime.fromJSDate(date).toISODate() ?? '');
  }

  login() {
    this.authService.login();
  }

  openWatchlistLoginPrompt() {
    this.loginRequired.open();
  }

  logout() {
    this.authService.logout().subscribe();
  }

}
