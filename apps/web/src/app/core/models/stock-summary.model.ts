import { TickerOhlc } from './ticker-ohlc.model';

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

export interface StockSummaryContext {
  appearsInHotStocks: boolean;
  hotStockLists: string[];
  hotStockRanks: {
    key: string;
    label: string;
    rank: number;
    tone: 'positive' | 'negative' | 'neutral';
  }[];
  marketCap: number | null;
  tradeValue: number;
  sectorTradeValue: number | null;
  sectorWeightByTradeValue: number | null;
}

export interface StockSummary {
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
  ohlc: TickerOhlc[];
  context: StockSummaryContext;
}
