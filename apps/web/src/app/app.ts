import { Component, OnInit, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DateTime } from 'luxon';
import { catchError, of } from 'rxjs';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { AssistantPanelComponent } from './layout/assistant-panel/assistant-panel.component';
import { LoginRequiredDialogComponent } from './layout/login-required-dialog/login-required-dialog.component';
import { GlobalProgressBarComponent } from './layout/global-progress-bar/global-progress-bar.component';
import { DashboardStateService } from './core/services/dashboard-state.service';
import { GlobalProgressRouterTrackerService } from './core/services/global-progress-router-tracker.service';
import { TradingDateService } from './core/services/trading-date.service';

@Component({
  imports: [
    RouterModule,
    GlobalProgressBarComponent,
    ToolbarComponent,
    FooterComponent,
    AssistantPanelComponent,
    LoginRequiredDialogComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly doc = inject(DOCUMENT);
  private readonly state = inject(DashboardStateService);
  private readonly tradingDateService = inject(TradingDateService);
  private readonly progressRouterTracker = inject(GlobalProgressRouterTrackerService);

  readonly dateReady = this.state.dateReady;

  ngOnInit() {
    this.progressRouterTracker.start();

    const params = new URLSearchParams(this.doc.defaultView?.location.search ?? '');
    const rawDate = params.get('date') ?? undefined;
    const parsed = rawDate ? DateTime.fromISO(rawDate) : null;

    if (parsed?.isValid) {
      this.state.setDate(parsed.toISODate()!);
      this.state.setDateReady();
    } else {
      const today = DateTime.local().toISODate() ?? '';
      this.tradingDateService.getLatestTradingDate(today).pipe(
        catchError(() => of(null))
      ).subscribe((result) => {
        this.state.setDate(result?.date ?? today);
        this.state.setDateReady();
      });
    }
  }
}
