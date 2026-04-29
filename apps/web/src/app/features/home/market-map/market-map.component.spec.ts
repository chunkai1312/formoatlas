import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import type { EChartsOption } from 'echarts';

import { ThemeService } from '../../../core/services/theme.service';
import { MarketMapResponse } from '../../../core/models/market-map.model';
import { MarketMapComponent } from './market-map.component';

const marketMap: MarketMapResponse = {
  date: '2026-04-24',
  market: 'TSE',
  sectors: [
    {
      industryCode: '24',
      name: '半導體',
      totalMarketCap: 30_000_000_000,
      totalTradeValue: 3_000_000_000,
      stocks: [
        {
          symbol: '2330',
          name: '台積電',
          marketCap: 20_000_000_000,
          tradeValue: 1_000_000_000,
          changePercent: 2,
          openPrice: 900,
          highPrice: 920,
          lowPrice: 895,
          closePrice: 910,
          tradeVolume: 12000,
        },
        {
          symbol: '2454',
          name: '聯發科',
          marketCap: 10_000_000_000,
          tradeValue: 2_000_000_000,
          changePercent: -1,
          openPrice: 1200,
          highPrice: 1220,
          lowPrice: 1180,
          closePrice: 1190,
          tradeVolume: 8000,
        },
      ],
    },
  ],
};

function treemapSeries(option: EChartsOption): any {
  return Array.isArray(option.series) ? option.series[0] : option.series;
}

describe('MarketMapComponent', () => {
  let fixture: ComponentFixture<MarketMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketMapComponent],
      providers: [
        {
          provide: ThemeService,
          useValue: { isDark: signal(false) },
        },
      ],
    })
      .overrideComponent(MarketMapComponent, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MarketMapComponent);
  });

  it('uses market cap as the default size value and weight', () => {
    fixture.componentRef.setInput('data', marketMap);
    fixture.detectChanges();

    const option = fixture.componentInstance.chartOption()!;
    const sector = treemapSeries(option).data[0];

    expect(sector.value).toEqual([30_000_000_000, 1]);
    expect(sector.children[0].value).toEqual([20_000_000_000, 2]);
    expect(sector.children[1].value).toEqual([10_000_000_000, -1]);
  });

  it('uses trade value as the size value and weight when selected', () => {
    fixture.componentRef.setInput('data', marketMap);
    fixture.componentRef.setInput('sizeMode', 'tradeValue');
    fixture.detectChanges();

    const option = fixture.componentInstance.chartOption()!;
    const sector = treemapSeries(option).data[0];

    expect(sector.value).toEqual([3_000_000_000, 0]);
    expect(sector.children[0].value).toEqual([1_000_000_000, 2]);
    expect(sector.children[1].value).toEqual([2_000_000_000, -1]);
  });

  it('returns no chart option when the selected size mode has no usable values', () => {
    fixture.componentRef.setInput('data', {
      ...marketMap,
      sectors: [
        {
          ...marketMap.sectors[0],
          totalTradeValue: 0,
          stocks: marketMap.sectors[0].stocks.map(stock => ({ ...stock, tradeValue: 0 })),
        },
      ],
    });
    fixture.componentRef.setInput('sizeMode', 'tradeValue');
    fixture.detectChanges();

    expect(fixture.componentInstance.chartOption()).toBeNull();
  });

  it('keeps size metrics out of tooltip output', () => {
    fixture.componentRef.setInput('data', marketMap);
    fixture.componentRef.setInput('sizeMode', 'tradeValue');
    fixture.detectChanges();

    const option = fixture.componentInstance.chartOption()!;
    const formatter = treemapSeries(option).tooltip.formatter;
    const html = formatter({ data: treemapSeries(option).data[0].children[0] });

    expect(html).not.toContain('大小指標');
    expect(html).not.toContain('成交金額');
    expect(html).not.toContain('市值');
    expect(html).toContain('開：');
    expect(html).toContain('量：12,000 張');
  });
});
