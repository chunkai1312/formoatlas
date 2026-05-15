import { Component, input, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DateTime } from 'luxon';
import {
  BarometerResult,
  BAROMETER_COLOR,
} from '../../../../core/models/barometer.model';
import { MarketStats } from '../../../../core/models/market-stats.model';
import { BreadthBarComponent } from './breadth-bar/breadth-bar.component';

@Component({
  selector: 'app-barometer-hero',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    BreadthBarComponent,
  ],
  templateUrl: './barometer-hero.component.html',
  styleUrl: './barometer-hero.component.scss',
})
export class BarometerHeroComponent {
  data = input<BarometerResult | null>(null);
  todayStats = input<MarketStats | null>(null);
  loading = input<boolean>(false);
  error = input<string | null>(null);

  readonly formattedDate = computed(() => {
    const d = this.data();
    if (!d) return '';
    const dt = DateTime.fromISO(d.date);
    return `${dt.year} 年 ${dt.month} 月 ${dt.day} 日`;
  });

  readonly accentColor = computed(() => {
    const d = this.data();
    return d ? BAROMETER_COLOR[d.level] : 'var(--color-neutral)';
  });

  readonly taiexUp = computed(() => (this.todayStats()?.taiexChange ?? 0) >= 0);

  readonly tradeValueBillions = computed(() => {
    const v = this.todayStats()?.taiexTradeValue;
    return v != null ? Math.round(v / 1e8) : null;
  });
}
