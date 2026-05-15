import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateTime } from 'luxon';
import { MarketStats } from '../../../../../core/models/market-stats.model';
import { TimeRange, RANGE_MONTHS } from '../../../../../core/services/dashboard-state.service';
import { IndicatorChartComponent } from '../indicator-chart/indicator-chart.component';
import { TAB_DEFINITIONS, buildChartOption, IndicatorDef } from '../chart-config';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-chart-tab-group',
  standalone: true,
  imports: [
    CommonModule,
    IndicatorChartComponent,
  ],
  templateUrl: './chart-tab-group.component.html',
  styleUrl: './chart-tab-group.component.scss',
})
export class ChartTabGroupComponent {
  data = input<MarketStats[]>([]);
  loading = input(false);

  readonly tabs = TAB_DEFINITIONS;
  readonly localRange = signal<TimeRange>('3M');
  readonly ranges: TimeRange[] = ['1M', '3M', '6M', '1Y'];
  readonly selectedTabIndex = signal(0);

  readonly filteredData = computed<MarketStats[]>(() => {
    const data = this.data();
    if (!data.length) return data;
    const end = data[data.length - 1].date;
    const months = RANGE_MONTHS[this.localRange()];
    const cutoff = DateTime.fromISO(end).minus({ months }).toISODate() ?? '';
    return data.filter(d => d.date >= cutoff);
  });

  // 每個 Tab 目前選取的指標 index，預設都是 0
  readonly selectedIndicatorIndex = signal<number[]>(
    TAB_DEFINITIONS.map(() => 0)
  );

  setLocalRange(range: TimeRange) {
    this.localRange.set(range);
  }

  selectIndicator(tabIndex: number, indicatorIndex: number) {
    this.selectedIndicatorIndex.update((prev) => {
      const next = [...prev];
      next[tabIndex] = indicatorIndex;
      return next;
    });
  }

  selectTab(tabIndex: number) {
    this.selectedTabIndex.set(tabIndex);
  }

  getChartOption(tabIndex: number): EChartsOption | null {
    const d = this.filteredData();
    if (!d.length) return null;
    const tab = this.tabs[tabIndex];
    const indIdx = this.selectedIndicatorIndex()[tabIndex];
    const indicator = tab.indicators[indIdx];
    return buildChartOption(d, indicator);
  }

  currentIndicator(tabIndex: number): IndicatorDef {
    const tab = this.tabs[tabIndex];
    return tab.indicators[this.selectedIndicatorIndex()[tabIndex]];
  }
}
