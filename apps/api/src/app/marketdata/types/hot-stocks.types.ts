export interface HotStockRankRow {
  symbol: string;
  name: string;
  date: string;
  market: string;
  closePrice: number;
  change: number;
  changePercent: number;
  tradeVolume: number;
  tradeValue: number;
  finiNet: number | null;
  sitcNet: number | null;
  finiConsecutiveDays: number | null;
  sitcConsecutiveDays: number | null;
}

export interface HotStocksResponse {
  date: string;
  market: 'TSE' | 'OTC';
  movers: {
    gainers: HotStockRankRow[];
    losers: HotStockRankRow[];
  };
  actives: {
    byVolume: HotStockRankRow[];
    byValue: HotStockRankRow[];
  };
  institutional: {
    finiBuy: HotStockRankRow[];
    finiSell: HotStockRankRow[];
    sitcBuy: HotStockRankRow[];
    sitcSell: HotStockRankRow[];
  };
}
