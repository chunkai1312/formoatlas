import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { DateTime } from 'luxon';
import { catchError, of } from 'rxjs';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ResearchAssistantComponent } from './layout/research-assistant/research-assistant.component';
import { DashboardStateService } from './core/services/dashboard-state.service';
import { TradingDateService } from './core/services/trading-date.service';

@Component({
  imports: [RouterModule, ToolbarComponent, FooterComponent, ResearchAssistantComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly state = inject(DashboardStateService);
  private readonly tradingDateService = inject(TradingDateService);

  readonly dateReady = this.state.dateReady;

  ngOnInit() {
    const rawDate = this.route.snapshot.queryParams['date'] as string | undefined;
    const parsed = rawDate ? DateTime.fromISO(rawDate) : null;
    const before = parsed?.isValid ? parsed.toISODate()! : (DateTime.local().toISODate() ?? '');

    this.tradingDateService.getLatestTradingDate(before).pipe(
      catchError(() => of({ date: before }))
    ).subscribe(({ date }) => {
      this.state.setDate(date);
      this.state.setDateReady();
    });
  }
}
