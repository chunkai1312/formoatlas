import { Component, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { TickerService } from '../../core/services/ticker.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';
import { SectorFlowStateService } from './sector-flow-state.service';
import { SectorRankingTableComponent } from './components/sector-ranking-table/sector-ranking-table.component';
import { SectorFlowChartsComponent } from './components/sector-flow-charts/sector-flow-charts.component';
import { SectorTradeWeightDistributionComponent } from './components/sector-trade-weight-distribution/sector-trade-weight-distribution.component';
import { KlineChartComponent } from '../dashboard/components/kline-chart/kline-chart.component';
import { SectorFlowSnapshot } from '../../core/models/sector-flow-snapshot.model';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap, catchError, finalize, of, combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-sector-flow',
  standalone: true,
  imports: [
    CommonModule,
    SectorTradeWeightDistributionComponent,
    SectorRankingTableComponent,
    SectorFlowChartsComponent,
    KlineChartComponent,
  ],
  providers: [SectorFlowStateService],
  templateUrl: './sector-flow.component.html',
  styleUrl: './sector-flow.component.scss',
})
export class SectorFlowComponent {
  private dashState = inject(DashboardStateService);
  private tickerService = inject(TickerService);
  private researchContext = inject(ResearchAssistantContextService);
  readonly state = inject(SectorFlowStateService);

  readonly rankingTable = viewChild(SectorRankingTableComponent);

  readonly selectedSymbol = this.state.selectedSymbol;
  readonly klineSymbol = this.state.klineSymbol;
  readonly rows = signal<SectorFlowSnapshot[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  setMarket(market: 'TSE' | 'OTC') {
    this.state.activeMarket.set(market);
    this.updateResearchContext();
  }

  onKlineSymbolChange(value: string) {
    this.state.klineSymbol.set(value);
    this.updateResearchContext();
  }

  selectSector(row: SectorFlowSnapshot) {
    this.state.selectedSymbol.set(row.symbol);
    this.state.selectedName.set(row.name);
    this.state.klineSymbol.set(row.symbol);
    this.updateResearchContext();
  }

  constructor() {
    combineLatest([
      toObservable(this.dashState.endDate),
      toObservable(this.state.activeMarket),
    ])
      .pipe(
        switchMap(([date, market]) => {
          this.loading.set(true);
          this.error.set(null);
          this.rows.set([]);
          this.rankingTable()?.setRows([]);
          this.state.sectors.set([]);
          this.state.selectedSymbol.set('');
          this.state.selectedName.set('');
          this.state.klineSymbol.set(undefined);

          return this.tickerService.getSectorFlow(date, market).pipe(
            catchError(() => {
              this.error.set('資料載入失敗，請稍後再試。');
              return of([] as SectorFlowSnapshot[]);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(rows => {
        this.rows.set(rows);
        this.rankingTable()?.setRows(rows);
        this.state.sectors.set(rows.map(r => ({ symbol: r.symbol, name: r.name })));
        if (rows.length) {
          const first = [...rows].sort((a, b) => b.changePercent - a.changePercent)[0];
          this.state.selectedSymbol.set(first.symbol);
          this.state.selectedName.set(first.name);
          this.state.klineSymbol.set(first.symbol);
        }
        this.updateResearchContext();
      });
  }

  private updateResearchContext() {
    this.researchContext.setContext({
      route: 'sector-flow',
      market: this.state.activeMarket(),
      symbol: this.state.klineSymbol(),
      sector: this.state.selectedName(),
    });
  }
}
