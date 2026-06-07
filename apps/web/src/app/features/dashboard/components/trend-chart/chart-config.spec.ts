import { describe, expect, it } from 'vitest';
import { buildChartOption, TAB_DEFINITIONS } from './chart-config';

describe('dashboard trend chart config', () => {
  it('adds margin maintenance ratio to the spot-market indicators', () => {
    const spotTab = TAB_DEFINITIONS.find(tab => tab.label === '現貨籌碼');

    expect(spotTab?.indicators.map(ind => ind.label)).toContain('融資維持率');
  });

  it('renders margin maintenance ratio as a percent line with null gaps', () => {
    const spotTab = TAB_DEFINITIONS.find(tab => tab.label === '現貨籌碼');
    const indicator = spotTab?.indicators.find(ind => ind.key === 'marginMaintenanceRatio');

    expect(indicator).toBeTruthy();
    const option = buildChartOption([
      { date: '2026-06-04', taiexPrice: 20000, marginMaintenanceRatio: 1.9876 } as any,
      { date: '2026-06-05', taiexPrice: 20100 } as any,
    ], indicator!);

    const series = option?.series as any[];
    const yAxis = option?.yAxis as any[];

    expect(series[1]).toMatchObject({
      name: '融資維持率',
      type: 'line',
      data: [198.76, null],
    });
    expect(yAxis[1].name).toBe('%');
  });
});
