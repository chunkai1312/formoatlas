import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectorFlowSnapshot } from '../../../../core/models/sector-flow-snapshot.model';

type SortKey = keyof Pick<SectorFlowSnapshot,
  'changePercent' | 'tradeValue' | 'tradeValuePrev' | 'tradeValueChange' |
  'tradeWeight' | 'tradeWeightPrev' | 'tradeWeightChange'>;

@Component({
  selector: 'app-sector-ranking-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sector-ranking-table.component.html',
  styleUrl: './sector-ranking-table.component.scss',
})
export class SectorRankingTableComponent {
  readonly loading = input(false);
  readonly rows = signal<SectorFlowSnapshot[]>([]);
  readonly sortKey = signal<SortKey>('changePercent');
  readonly sortDir = signal<1 | -1>(-1);

  readonly sorted = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir();
    return [...this.rows()].sort((a, b) => {
      const av = a[key] ?? -Infinity;
      const bv = b[key] ?? -Infinity;
      return (av > bv ? 1 : av < bv ? -1 : 0) * dir;
    });
  });

  readonly maxAbsChange = computed(() =>
    Math.max(...this.rows().map(r => Math.abs(r.changePercent)), 0.01)
  );

  barPct(v: number): number {
    return Math.round((Math.abs(v) / this.maxAbsChange()) * 100);
  }

  setRows(rows: SectorFlowSnapshot[]) {
    this.rows.set(rows);
  }

  sort(key: SortKey) {
    if (this.sortKey() === key) {
      this.sortDir.update(d => d === 1 ? -1 : 1);
    } else {
      this.sortKey.set(key);
      this.sortDir.set(-1);
    }
  }

  fmtValue(v: number) {
    return (v / 1e8).toFixed(2);
  }

  fmtWeight(v: number) {
    return v.toFixed(2);
  }

  fmtChange(v: number) {
    return (v >= 0 ? '+' : '') + v.toFixed(2);
  }

  fmtWeightChange(v: number) {
    return (v >= 0 ? '+' : '') + v.toFixed(2);
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey() !== key) return 'pi pi-sort-alt';
    return this.sortDir() === -1 ? 'pi pi-arrow-down' : 'pi pi-arrow-up';
  }
}
