import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { HotStockRankRow } from '../../../../core/models/hot-stocks.model';

type MetricKey = 'tradeVolume' | 'tradeValue' | 'finiNet' | 'sitcNet' | 'changePercent';
type MetricKind = 'volume' | 'value' | 'net' | 'percent';

@Component({
  selector: 'app-hot-stock-ranking-table',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './hot-stock-ranking-table.component.html',
  styleUrl: './hot-stock-ranking-table.component.scss',
})
export class HotStockRankingTableComponent {
  readonly title = input.required<string>();
  readonly rows = input.required<HotStockRankRow[]>();
  readonly metricLabel = input.required<string>();
  readonly metricKey = input.required<MetricKey>();
  readonly metricKind = input<MetricKind>('net');

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
