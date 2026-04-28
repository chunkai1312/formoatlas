import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketStats } from '../../../../core/models/market-stats.model';
import { StatCardComponent } from './stat-card/stat-card.component';

@Component({
  selector: 'app-stats-overview',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  templateUrl: './stats-overview.component.html',
  styleUrl: './stats-overview.component.scss',
})
export class StatsOverviewComponent {
  stats = input<MarketStats | null>(null);
  loading = input<boolean>(false);
}
