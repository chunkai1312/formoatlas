export interface MarketMapItem {
  symbol: string;
  name: string;
  marketCap: number;
  tradeValue: number;
  changePercent: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  tradeVolume: number;
}

export interface MarketMapSector {
  industryCode: string;
  name: string;
  totalMarketCap: number;
  totalTradeValue: number;
  stocks: MarketMapItem[];
}

export interface MarketMapResponse {
  date: string;
  market: 'TSE' | 'OTC';
  sectors: MarketMapSector[];
}
