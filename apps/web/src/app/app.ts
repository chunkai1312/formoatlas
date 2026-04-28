import { Component, OnInit, inject, signal } from '@angular/core';
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

  readonly bannerLatestDate = signal<string | null>(null);

  ngOnInit() {
    const rawDate = this.route.snapshot.queryParams['date'] as string | undefined;
    const parsed = rawDate ? DateTime.fromISO(rawDate) : null;
    if (parsed?.isValid) {
      this.state.setDate(parsed.toISODate()!);
    }

    const today = DateTime.local().toISODate() ?? '';
    this.tradingDateService.getLatestTradingDate(today).pipe(
      catchError(() => of(null))
    ).subscribe((result) => {
      if (result && result.date < today) {
        this.bannerLatestDate.set(result.date);
      }
    });
  }

  navigateToLatestTradingDay() {
    const date = this.bannerLatestDate();
    if (date) {
      this.state.setDate(date);
      this.bannerLatestDate.set(null);
    }
  }
}
