import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TickerOhlc } from '../models/ticker-ohlc.model';
import { SectorFlowSnapshot } from '../models/sector-flow-snapshot.model';
import { HotStocksResponse } from '../models/hot-stocks.model';

@Injectable({ providedIn: 'root' })
export class TickerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/marketdata/tickers';
  private readonly sectorFlowUrl = '/api/marketdata/sector-flow';
  private readonly hotStocksUrl = '/api/marketdata/hot-stocks';

  getTicker(symbol: string, startDate: string, endDate: string): Observable<TickerOhlc[]> {
    return this.http.get<TickerOhlc[]>(this.baseUrl, {
      params: { symbol, startDate, endDate },
    });
  }

  getSectorFlow(date: string, market?: 'TSE' | 'OTC'): Observable<SectorFlowSnapshot[]> {
    const params: Record<string, string> = { date };
    if (market) params['market'] = market;
    return this.http.get<SectorFlowSnapshot[]>(this.sectorFlowUrl, { params });
  }

  getHotStocks(date: string, market?: 'TSE' | 'OTC'): Observable<HotStocksResponse> {
    const params: Record<string, string> = { date };
    if (market) params['market'] = market;
    return this.http.get<HotStocksResponse>(this.hotStocksUrl, { params });
  }
}
