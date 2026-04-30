export interface StockSummaryQuote {
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  change: number;
  changePercent: number;
  tradeVolume: number;
  tradeValue: number;
  transaction: number;
}

export interface StockSummaryInstitutional {
  finiNet: number | null;
  sitcNet: number | null;
  dealersNet: number | null;
  finiConsecutiveDays: number | null;
  sitcConsecutiveDays: number | null;
}

export interface StockSummaryOhlcRow {
  date: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  tradeVolume: number;
  tradeValue: number;
}

export interface StockSummaryHotStockRank {
  key: string;
  label: string;
  rank: number;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface StockSummaryContext {
  appearsInHotStocks: boolean;
  hotStockLists: string[];
  hotStockRanks: StockSummaryHotStockRank[];
  marketCap: number | null;
  tradeValue: number;
  sectorTradeValue: number | null;
  sectorWeightByTradeValue: number | null;
}

export interface StockSummaryResponse {
  requestedDate: string;
  date: string;
  symbol: string;
  name: string;
  market: 'TSE' | 'OTC';
  exchange: string;
  industryCode: string | null;
  industryName: string | null;
  quote: StockSummaryQuote;
  institutional: StockSummaryInstitutional;
  ohlc: StockSummaryOhlcRow[];
  context: StockSummaryContext;
}
