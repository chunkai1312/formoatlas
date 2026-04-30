export interface TickerOhlc {
  date: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  tradeVolume?: number;
  tradeValue: number;
  tradeWeight?: number;
}
