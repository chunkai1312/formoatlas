import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HotStockRankRow } from '../../../../core/models/hot-stocks.model';

type MetricKey = 'tradeVolume' | 'tradeValue' | 'finiNet' | 'sitcNet' | 'changePercent';
type MetricKind = 'volume' | 'value' | 'net' | 'percent';
type ConsecutiveDaysKey = 'finiConsecutiveDays' | 'sitcConsecutiveDays';
type SecondaryNetKey = 'finiNet' | 'sitcNet';

@Component({
  selector: 'app-hot-stock-ranking-table',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './hot-stock-ranking-table.component.html',
  styleUrl: './hot-stock-ranking-table.component.scss',
})
export class HotStockRankingTableComponent {
  readonly title = input.required<string>();
  readonly rows = input.required<HotStockRankRow[]>();
  readonly metricLabel = input.required<string>();
  readonly metricKey = input.required<MetricKey>();
  readonly metricKind = input<MetricKind>('net');
  readonly consecutiveDaysKey = input<ConsecutiveDaysKey | null>(null);
  readonly secondaryNetKey = input<SecondaryNetKey | null>(null);
  readonly secondaryLabel = input<string | null>(null);
  readonly watchList = input<string[]>([]);
  readonly pendingWatchSymbols = input<Set<string>>(new Set<string>());
  readonly watchlistToggle = output<HotStockRankRow>();

  metricValue(row: HotStockRankRow): number | null {
    return row[this.metricKey()] ?? null;
  }

  metricClass(row: HotStockRankRow) {
    const value = this.metricValue(row);
    return {
      positive: value !== null && value > 0,
      negative: value !== null && value < 0,
    };
  }

  badgeText(row: HotStockRankRow): string | null {
    const key = this.consecutiveDaysKey();
    if (!key) return null;
    const days = row[key];
    if (days === null || days === undefined || days === 0) return null;
    if (days >= 2) return `連${days}買`;
    if (days <= -2) return `連${Math.abs(days)}賣`;
    return null;
  }

  badgeClass(row: HotStockRankRow): string | null {
    const key = this.consecutiveDaysKey();
    if (!key) return null;
    const days = row[key];
    if (days === null || days === undefined || days === 0) return null;
    if (days >= 2) return 'badge badge--buy';
    if (days <= -2) return 'badge badge--sell';
    return null;
  }

  secondaryBadgeText(row: HotStockRankRow): string | null {
    const key = this.secondaryNetKey();
    const label = this.secondaryLabel();
    if (!key || !label) return null;
    const primaryVal = row[this.metricKey() as SecondaryNetKey] ?? 0;
    const secondaryVal = row[key] ?? 0;
    if (primaryVal > 0 && secondaryVal > 0) return `${label}買`;
    if (primaryVal < 0 && secondaryVal < 0) return `${label}賣`;
    return null;
  }

  secondaryBadgeClass(row: HotStockRankRow): string {
    const primaryVal = row[this.metricKey() as SecondaryNetKey] ?? 0;
    return primaryVal > 0 ? 'badge badge--buy-secondary' : 'badge badge--sell-secondary';
  }

  isWatched(symbol: string): boolean {
    return this.watchList().includes(symbol);
  }

  isWatchPending(symbol: string): boolean {
    return this.pendingWatchSymbols().has(symbol);
  }

  watchlistLabel(row: HotStockRankRow): string {
    return this.isWatched(row.symbol)
      ? `移除 ${row.symbol} ${row.name} 自選股`
      : `加入 ${row.symbol} ${row.name} 自選股`;
  }

  toggleWatchlist(row: HotStockRankRow) {
    if (this.isWatchPending(row.symbol)) return;
    this.watchlistToggle.emit(row);
  }

  fmtPrice(value: number) {
    return value.toFixed(2);
  }

  fmtChange(value: number) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
  }

  fmtMetric(value: number | null) {
    if (value === null) return '-';

    switch (this.metricKind()) {
      case 'value':
        return (value / 1e8).toFixed(2);
      case 'percent':
        return `${this.fmtChange(value)}%`;
      case 'volume':
      case 'net':
        return Math.round(value / 1000).toLocaleString('en-US');
      default:
        return Math.round(value).toLocaleString('en-US');
    }
  }
}
