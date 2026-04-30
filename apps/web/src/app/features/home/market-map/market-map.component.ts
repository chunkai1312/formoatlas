import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { ThemeService } from '../../../core/services/theme.service';
import { MarketMapResponse, MarketMapItem } from '../../../core/models/market-map.model';

export type MarketMapSizeMode = 'marketCap' | 'tradeValue';

@Component({
  selector: 'app-market-map',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  templateUrl: './market-map.component.html',
  styleUrl: './market-map.component.scss',
})
export class MarketMapComponent {
  readonly data = input<MarketMapResponse | null>(null);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly sizeMode = input<MarketMapSizeMode>('marketCap');
  readonly stockSelected = output<string>();

  private readonly themeService = inject(ThemeService);
  readonly isDark = this.themeService.isDark;

  // Taiwan convention: red = gain (+), green = loss (-)
  // Dark:  bright green at -10% → dark toward 0% → dark brownish-red → bright red at +10%
  // Light: medium green at -10% → pale mint → near-white → pale pink → coral-red at +10%
  private static readonly COLORS_DARK = [
    '#22c55e', '#16a34a', '#15803d',  // -10% → -3%  vibrant → deep green
    '#374151',                         //  0%   dark neutral gray
    '#7f1d1d', '#b91c1c', '#dc2626',  // +3% → +10%  dark brownish → bright red
  ];
  private static readonly COLORS_LIGHT = [
    '#22c55e', '#4ade80', '#bbf7d0',  // -10% → -3%  medium → pale green
    '#f3f4f6',                         //  0%   near-white gray
    '#fecaca', '#fca5a5', '#f87171',  // +3% → +10%  pale pink → coral-red
  ];

  readonly chartOption = computed<EChartsOption | null>(() => {
    const response = this.data();
    const dark = this.isDark();
    const sizeMode = this.sizeMode();
    if (!response || !response.sectors.length) return null;

    const seriesData = response.sectors.map(sector => {
      const sectorSize = this.sizeValue(sector, sizeMode);
      const totalWeight = sectorSize || 1;
      const weightedChange = sector.stocks.reduce(
        (sum, s) => sum + s.changePercent * (this.sizeValue(s, sizeMode) / totalWeight),
        0,
      );
      return {
        name: sector.name,
        // value[0] = size, value[1] = changePercent for visualMap
        value: [sectorSize, weightedChange],
        children: sector.stocks.map((stock: MarketMapItem) => ({
          name: stock.name,
          value: [this.sizeValue(stock, sizeMode), stock.changePercent],
          // Extra fields carried for tooltip
          symbol: stock.symbol,
          changePercent: stock.changePercent,
          marketCap: stock.marketCap,
          tradeValue: stock.tradeValue,
          openPrice: stock.openPrice,
          highPrice: stock.highPrice,
          lowPrice: stock.lowPrice,
          closePrice: stock.closePrice,
          tradeVolume: stock.tradeVolume,
        })),
      };
    }).filter(sector => sector.value[0] > 0);

    if (!seriesData.length) return null;

    return {
      animation: false,
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        confine: true,
        backgroundColor: dark ? '#1f2937' : '#ffffff',
        borderColor: dark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: dark ? '#f3f4f6' : '#111827',
          fontSize: 13,
        },
        extraCssText: dark
          ? 'box-shadow: 0 4px 16px rgba(0,0,0,0.5);'
          : 'box-shadow: 0 4px 16px rgba(0,0,0,0.12);',
      },
      visualMap: {
        show: true,
        type: 'continuous',
        dimension: 1,       // 使用 value[1]（changePercent）做顏色映射
        min: -10,
        max: 10,
        inRange: {
          color: dark
            ? MarketMapComponent.COLORS_DARK
            : MarketMapComponent.COLORS_LIGHT,
        },
        text: ['+10%', '-10%'],
        textStyle: { fontSize: 11, color: dark ? '#d1d5db' : '#374151' },
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 4,
        itemWidth: 16,
        itemHeight: 120,
      },
      series: [
        {
          type: 'treemap',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          // Series-level label color 作為全局預設，确保覆蓋 ECharts 內建白色
          label: {
            color: dark ? '#ffffff' : '#111827',
          },
          upperLabel: { show: false },
          width: '100%',
          height: '92%',
          top: 0,
          left: 0,
          levels: [
            {
              // Level 0: industry sectors — 自身不顯示 upperLabel
              upperLabel: { show: false },
              itemStyle: {
                borderWidth: 2,
                borderColor: dark ? '#0f172a' : '#e5e7eb',
                gapWidth: 2,
              },
            },
            {
              // Level 1: individual stocks
              // upperLabel.show: true 在此層設定，使 ECharts 為每個 sector 顯示產業名稱 header bar
              visibleMin: 300,
              upperLabel: {
                show: true,
                height: 26,
                fontSize: 12,
                fontWeight: 'bold',
                color: dark ? '#f3f4f6' : '#374151',
                backgroundColor: dark ? '#1e293b' : '#e2e8f0',
                overflow: 'truncate',
                padding: [4, 8],
              },
              itemStyle: {
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.2)',
                gapWidth: 1,
              },
              label: {
                show: true,
                position: 'inside',
                fontSize: 11,
                rich: {
                  n: { color: dark ? '#ffffff' : '#111827', fontSize: 11, lineHeight: 16 },
                  p: { color: dark ? '#ffffff' : '#111827', fontSize: 10, lineHeight: 14 },
                },
                overflow: 'truncate',
                formatter: (params: any) => {
                  const cp = params.data?.changePercent ?? 0;
                  const sign = cp >= 0 ? '+' : '';
                  return params.name;
                },
              },
            },
          ],
          data: seriesData,
          tooltip: {
            formatter: (params: any) => {
              const d = params.data;
              if (!d?.symbol) {
                // Sector node — 不顯示 tooltip
                return undefined;
              }

              const cp: number = d.changePercent ?? 0;
              const close: number = d.closePrice ?? 0;
              // 絕對漲跌 = closePrice × changePercent / (100 + changePercent)
              const change = close * cp / (100 + cp);
              const prevClose = close - change;   // 昨收（參考價）
              const sign = cp >= 0 ? '+' : '';
              const changeColor = cp >= 0 ? '#ef4444' : '#22c55e';
              const vol = (d.tradeVolume ?? 0).toLocaleString('zh-TW');

              // 依各欄位與昨收比較決定顏色
              const priceColor = (v: number): string => {
                if (v > prevClose + 0.001) return '#ef4444';  // 高於參考價 → 紅
                if (v < prevClose - 0.001) return '#22c55e';  // 低於參考價 → 綠
                return '';                                      // 平 → 預設色
              };
              const fmtPrice = (v: number) => {
                const c = priceColor(v);
                const s = v.toFixed(2);
                return c ? `<span style="color:${c}">${s}</span>` : s;
              };

              return [
                `<strong>${d.name}</strong> <span style="color:#94a3b8">(${d.symbol})</span>`,
                `開：${fmtPrice(d.openPrice ?? 0)}`,
                `高：${fmtPrice(d.highPrice ?? 0)}`,
                `低：${fmtPrice(d.lowPrice ?? 0)}`,
                `收：${fmtPrice(close)}`,
                `漲：<span style="color:${changeColor}">${sign}${change.toFixed(2)}</span>`,
                `幅：<span style="color:${changeColor}">${sign}${cp.toFixed(2)}%</span>`,
                `量：${vol} 張`,
              ].join('<br/>');
            },
          },
        },
      ],
    } as EChartsOption;
  });

  handleChartClick(event: any) {
    const symbol = event?.data?.symbol;
    if (typeof symbol === 'string' && symbol) {
      this.stockSelected.emit(symbol);
    }
  }

  private sizeValue(
    item: MarketMapItem | { totalMarketCap: number; totalTradeValue: number },
    sizeMode: MarketMapSizeMode,
  ): number {
    const raw = 'symbol' in item
      ? (sizeMode === 'tradeValue' ? item.tradeValue : item.marketCap)
      : (sizeMode === 'tradeValue' ? item.totalTradeValue : item.totalMarketCap);

    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  }

}
