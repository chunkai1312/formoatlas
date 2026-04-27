import { Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { SectorFlowComponent } from './sector-flow.component';
import { SectorFlowSnapshot } from '../../core/models/sector-flow-snapshot.model';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';
import { TickerService } from '../../core/services/ticker.service';
import { KlineChartComponent } from '../dashboard/components/kline-chart/kline-chart.component';
import { SectorFlowChartsComponent } from './components/sector-flow-charts/sector-flow-charts.component';
import { SectorRankingTableComponent } from './components/sector-ranking-table/sector-ranking-table.component';

class MockDashboardStateService {
  readonly selectedDate = signal('2026-04-24');
  readonly endDate = this.selectedDate;
}

@Component({
  selector: 'app-sector-ranking-table',
  standalone: true,
  template: '<div class="ranking-stub"></div>',
})
class StubSectorRankingTableComponent {
  setRows = vi.fn();
}

@Component({
  selector: 'app-sector-flow-charts',
  standalone: true,
  template: '<div class="charts-stub"></div>',
})
class StubSectorFlowChartsComponent {}

@Component({
  selector: 'app-kline-chart',
  standalone: true,
  template: '<div class="kline-stub"><ng-content select="[cardTitle]"></ng-content></div>',
})
class StubKlineChartComponent {
  readonly symbol = input<string>();
}

function buildSector(index: number, tradeWeight: number, changePercent = index): SectorFlowSnapshot {
  return {
    symbol: `S${index}`,
    name: `產業${index}`,
    date: '2026-04-24',
    closePrice: 100 + index,
    change: index,
    changePercent,
    tradeValue: tradeWeight * 100_000_000,
    tradeValuePrev: (tradeWeight - 1) * 100_000_000,
    tradeValueChange: 100_000_000,
    tradeWeight,
    tradeWeightPrev: tradeWeight - 1,
    tradeWeightChange: index % 2 === 0 ? 1.23 : -0.45,
    rs: null,
  };
}

describe('SectorFlowComponent', () => {
  let fixture: ComponentFixture<SectorFlowComponent>;
  let contextService: ResearchAssistantContextService;

  const rows = [
    buildSector(1, 11, 3),
    buildSector(2, 42, 2),
    buildSector(3, 31, 1),
    buildSector(4, 25, 4),
    buildSector(5, 21, 5),
    buildSector(6, 18, 6),
    buildSector(7, 15, 7),
    buildSector(8, 12, 8),
    buildSector(9, 10, 9),
    buildSector(10, 8, 10),
    buildSector(11, 1, 11),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectorFlowComponent],
      providers: [
        { provide: DashboardStateService, useClass: MockDashboardStateService },
        {
          provide: TickerService,
          useValue: {
            getSectorFlow: vi.fn().mockReturnValue(of(rows)),
          },
        },
        ResearchAssistantContextService,
      ],
    })
      .overrideComponent(SectorFlowComponent, {
        remove: {
          imports: [
            SectorRankingTableComponent,
            SectorFlowChartsComponent,
            KlineChartComponent,
          ],
        },
        add: {
          imports: [
            StubSectorRankingTableComponent,
            StubSectorFlowChartsComponent,
            StubKlineChartComponent,
          ],
        },
      })
      .compileComponents();

    contextService = TestBed.inject(ResearchAssistantContextService);
    fixture = TestBed.createComponent(SectorFlowComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders the top ten sectors by trade weight above the ranking table', () => {
    const text = fixture.nativeElement.textContent as string;
    const distributionRows = fixture.nativeElement.querySelectorAll('.distribution-row');
    const sectorNames = Array.from(
      fixture.nativeElement.querySelectorAll('.distribution-row .sector-name')
    ).map((el) => (el as HTMLElement).textContent?.trim());

    expect(text).toContain('成交比重分佈');
    expect(text).toContain('點選產業可更新下方明細');
    expect(distributionRows).toHaveLength(10);
    expect(sectorNames).toContain('產業2');
    expect(text).toContain('42.00%');
    expect(sectorNames).toContain('產業10');
    expect(sectorNames).not.toContain('產業11');
  });

  it('selects a sector from the trade weight distribution and syncs detail panels', () => {
    const component = fixture.componentInstance;
    const target = fixture.debugElement.queryAll(By.css('.distribution-row'))[1];

    target.nativeElement.click();
    fixture.detectChanges();

    expect(component.state.selectedSymbol()).toBe('S3');
    expect(component.state.selectedName()).toBe('產業3');
    expect(component.state.klineSymbol()).toBe('S3');
    expect(target.nativeElement.classList.contains('active')).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('資金流向明細');
    expect(fixture.nativeElement.textContent).toContain('產業類股走勢');
    expect(fixture.nativeElement.textContent).not.toContain('資金流向明細 · 產業3');
    expect(fixture.nativeElement.textContent).not.toContain('產業類股走勢 · 產業3');
    expect(contextService.context()).toEqual({
      route: 'sector-flow',
      market: 'TSE',
      symbol: 'S3',
      sector: '產業3',
    });
  });
});
