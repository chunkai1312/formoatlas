import type { EChartsOption, SeriesOption } from 'echarts';
import { MarketStats } from '../../../../core/models/market-stats.model';

export type ChartType = 'bar' | 'line';

export interface IndicatorDef {
  key: keyof MarketStats;
  label: string;
  unit: string;
  chartType: ChartType;
  hasReferenceLine?: boolean;   // y=1 參考線
  fixedColor?: string;          // 指定固定顏色（不用紅漲綠跌）
  scaleAxis?: boolean;          // 右側 Y 軸從資料範圍縮放（不從 0 開始）
  companions?: IndicatorDef[];  // 同圖並列的伴隨指標
  chipLabel?: string;           // Chip 顯示用的短標籤（不影響圖表 legend）
}

export interface TabDef {
  label: string;
  indicators: IndicatorDef[];
}

export const TAB_DEFINITIONS: TabDef[] = [
  {
    label: '現貨籌碼',
    indicators: [
      { key: 'finiNetBuySell',      label: '外資買賣超',   unit: '億元', chartType: 'bar' },
      { key: 'sitcNetBuySell',      label: '投信買賣超',   unit: '億元', chartType: 'bar' },
      { key: 'dealersNetBuySell',   label: '自營商買賣超', unit: '億元', chartType: 'bar' },
      { key: 'marginBalance',       label: '融資餘額',   unit: '億元', chartType: 'bar', fixedColor: '#3B82F6', scaleAxis: true },
      { key: 'shortBalance',        label: '融券餘額',   unit: '張',   chartType: 'bar', fixedColor: '#3B82F6', scaleAxis: true },
      { key: 'marginMaintenanceRatio', label: '融資維持率', unit: '%', chartType: 'line', fixedColor: '#3B82F6', scaleAxis: true },
    ],
  },
  {
    label: '期貨籌碼',
    indicators: [
      { key: 'finiTxfNetOi',                    label: '外資台指淨未平倉', unit: '口', chartType: 'bar' },
      { key: 'retailMxfNetOi',                  label: '散戶小台淨未平倉',  unit: '口', chartType: 'bar' },
      { key: 'retailTmfNetOi',                  label: '散戶微台淨未平倉',  unit: '口', chartType: 'bar' },
      { key: 'topTenSpecificFrontMonthTxfNetOi', label: '近月台指淨未平倉', chipLabel: '大額交易人台指淨未平倉', unit: '口', chartType: 'bar', fixedColor: '#3B82F6',
        companions: [
          { key: 'topTenSpecificBackMonthsTxfNetOi', label: '遠月台指淨未平倉', unit: '口', chartType: 'bar', fixedColor: '#8B5CF6' },
        ],
      },
    ],
  },
  {
    label: '選擇權籌碼',
    indicators: [
      { key: 'finiTxoNetOiValue',         label: '外資台指選擇權淨未平倉',   unit: '億元', chartType: 'bar' },
      { key: 'finiTxoCallsNetOiValue',    label: '外資台指買權淨未平倉',  unit: '億元', chartType: 'bar' },
      { key: 'finiTxoPutsNetOiValue',     label: '外資台指賣權淨未平倉',   unit: '億元', chartType: 'bar' },
      { key: 'txoPutCallRatio',          label: '台指選擇權 P/C Ratio',        unit: '%',    chartType: 'bar', hasReferenceLine: true, fixedColor: '#3B82F6' },
    ],
  },
  {
    label: '匯率走勢',
    indicators: [
      { key: 'usdtwd', label: 'USD/TWD', unit: '', chartType: 'line', scaleAxis: true },
    ],
  },
];

// 各欄位的縮放比例（原始值 ÷ scale → 顯示值）
const SCALE_MAP: Partial<Record<keyof MarketStats, number>> = {
  finiNetBuySell: 1e8,       // 元 → 億元
  sitcNetBuySell: 1e8,
  dealersNetBuySell: 1e8,
  marginBalance: 1e5,         // 仟元 → 億元
  marginBalanceChange: 1e5,
  marginMaintenanceRatio: 0.01, // 小數 → %
  finiTxoCallsNetOiValue: 1e5,
  finiTxoPutsNetOiValue: 1e5,
  finiTxoNetOiValue: 1e5,
  txoPutCallRatio: 0.01,           // 小數 → %（× 100）
};

function scaleValue(key: keyof MarketStats, v: number): number {
  const scale = SCALE_MAP[key];
  return scale ? +(v / scale).toFixed(2) : v;
}

export function buildChartOption(
  data: MarketStats[],
  indicator: IndicatorDef,
): EChartsOption | null {
  if (!data.length) return null;

  const dates = data.map((d) => d.date);
  const taiexValues = data.map((d) => d.taiexPrice ?? null);
  const allIndicators = [indicator, ...(indicator.companions ?? [])];
  const unitMap = new Map(allIndicators.map((ind) => [ind.label, ind.unit]));
  const isBar = indicator.chartType === 'bar';

  const secondarySeries: SeriesOption[] = allIndicators.map((ind) => {
    const values = data.map((d) => {
      const raw = d[ind.key] as number;
      return raw != null ? scaleValue(ind.key, raw) : null;
    });
    if (ind.chartType === 'bar') {
      return {
        name: ind.label,
        type: 'bar' as const,
        yAxisIndex: 1,
        data: values,
        itemStyle: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: ind.fixedColor ?? ((params: any) => params.value >= 0 ? '#EF4444' : '#22C55E'),
        },
      };
    } else {
      return {
        name: ind.label,
        type: 'line' as const,
        yAxisIndex: 1,
        data: values,
        smooth: true,
        lineStyle: { color: ind.fixedColor ?? '#3B82F6', width: 2 },
        symbol: 'none',
        ...(ind.hasReferenceLine
          ? {
              markLine: {
                silent: true,
                symbol: ['none', 'none'],
                lineStyle: { type: 'dashed' as const, color: '#F59E0B', width: 1.5 },
                data: [{ yAxis: 1, name: '參考線 (1)' }],
              },
            }
          : {}),
      };
    }
  });

  return {
    backgroundColor: 'transparent',
    grid: { right: '80px', left: '70px', top: '40px', bottom: '60px' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any) => {
        const p = params as { axisValue: string; seriesName: string; value: number; color: string }[];
        if (!p.length) return '';
        let html = `<b>${p[0].axisValue}</b><br/>`;
        p.forEach((item) => {
          const unit = item.seriesName === '加權指數' ? '' : ` ${unitMap.get(item.seriesName) ?? indicator.unit}`;
          const val =
            item.value != null
              ? item.value.toLocaleString('zh-TW', { minimumFractionDigits: 0 })
              : '—';
          html += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:6px;"></span>`;
          html += `${item.seriesName}: <b>${val}${unit}</b><br/>`;
        });
        return html;
      },
    },
    legend: {
      top: 4,
      data: ['加權指數', ...allIndicators.map((ind) => ind.label)],
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: isBar,
      axisLabel: {
        formatter: (v: string) => v.substring(5), // MM-DD
        rotate: 30,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '加權指數',
        scale: true,
        axisLabel: { formatter: (v: number) => v.toLocaleString('zh-TW') },
      },
      {
        type: 'value',
        name: indicator.unit || '',
        scale: allIndicators.some((ind) => ind.scaleAxis),
        splitLine: { show: false },
        axisLabel: {
          formatter: (v: number) => v.toLocaleString('zh-TW'),
        },
      },
    ],
    series: [
      {
        name: '加權指數',
        type: 'line',
        yAxisIndex: 0,
        data: taiexValues,
        smooth: true,
        lineStyle: { color: '#F59E0B', width: 2.5 },
        symbol: 'none',
      },
      ...(secondarySeries as EChartsOption['series'] extends (infer T)[] ? T[] : never[]),
    ],
  } as EChartsOption;
}
