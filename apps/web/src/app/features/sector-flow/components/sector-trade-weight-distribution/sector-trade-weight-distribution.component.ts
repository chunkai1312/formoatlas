import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { SectorFlowSnapshot } from '../../../../core/models/sector-flow-snapshot.model';

@Component({
  selector: 'app-sector-trade-weight-distribution',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './sector-trade-weight-distribution.component.html',
  styleUrl: './sector-trade-weight-distribution.component.scss',
})
export class SectorTradeWeightDistributionComponent {
  readonly rows = input<SectorFlowSnapshot[]>([]);
  readonly sectorSelected = output<SectorFlowSnapshot>();

  readonly topRows = computed(() =>
    [...this.rows()]
      .sort((a, b) => b.tradeWeight - a.tradeWeight)
      .slice(0, 10)
  );

  readonly maxWeight = computed(() =>
    Math.max(...this.topRows().map((row) => row.tradeWeight), 0.01)
  );

  barWidth(row: SectorFlowSnapshot): number {
    return Math.max((row.tradeWeight / this.maxWeight()) * 100, 1);
  }

  formatWeight(value: number): string {
    return value.toFixed(2);
  }

  formatWeightChange(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
  }

  select(row: SectorFlowSnapshot) {
    this.sectorSelected.emit(row);
  }
}
