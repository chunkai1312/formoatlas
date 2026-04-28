import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TickerOhlc } from '../models/ticker-ohlc.model';
import { SectorFlowSnapshot } from '../models/sector-flow-snapshot.model';
import { HotStocksResponse } from '../models/hot-stocks.model';
import { MarketMapResponse } from '../models/market-map.model';

@Injectable({ providedIn: 'root' })
export class TickerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/marketdata/tickers';
  private readonly sectorFlowUrl = '/api/marketdata/sector-flow';
  private readonly hotStocksUrl = '/api/marketdata/hot-stocks';
  private readonly marketMapUrl = '/api/marketdata/market-map';

  getTicker(symbol: string, startDate: string, endDate: string): Observable<TickerOhlc[]> {
    return this.http.get<TickerOhlc[]>(this.baseUrl, {
      params: { symbol, startDate, endDate },
    });
  }

  getSectorFlow(date: string, market?: 'TSE' | 'OTC'): Observable<SectorFlowSnapshot[]> {
    const params: Record<string, string> = { date };
    if (market) params['market'] = market;
    return this.http.get<SectorFlowSnapshot[]>(this.sectorFlowUrl, { params }).pipe(
      map(result => result.filter(r => r.date === date))
    );
  }

  getHotStocks(date: string, market?: 'TSE' | 'OTC'): Observable<HotStocksResponse> {
    const params: Record<string, string> = { date };
    if (market) params['market'] = market;
    return this.http.get<HotStocksResponse>(this.hotStocksUrl, { params }).pipe(
      map(result => result.date === date ? result : {
        date,
        market: market ?? 'TSE',
        movers: { gainers: [], losers: [] },
        actives: { byVolume: [], byValue: [] },
        institutional: { finiBuy: [], finiSell: [], sitcBuy: [], sitcSell: [] },
      })
    );
  }

  getMarketMap(date: string, market?: 'TSE' | 'OTC'): Observable<MarketMapResponse> {
    const params: Record<string, string> = { date };
    if (market) params['market'] = market;
    return this.http.get<MarketMapResponse>(this.marketMapUrl, { params }).pipe(
      map(result => result.date === date ? result : { date, market: market ?? 'TSE', sectors: [] })
    );
  }
}
