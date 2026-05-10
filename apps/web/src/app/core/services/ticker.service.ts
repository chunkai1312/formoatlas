import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TickerOhlc } from '../models/ticker-ohlc.model';
import { SectorFlowSnapshot } from '../models/sector-flow-snapshot.model';
import { HotStocksResponse } from '../models/hot-stocks.model';
import { MarketMapResponse } from '../models/market-map.model';
import { TickerMetadata } from '../models/ticker-metadata.model';
import { StockSummary } from '../models/stock-summary.model';

@Injectable({ providedIn: 'root' })
export class TickerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/marketdata/tickers';
  private readonly sectorFlowUrl = '/api/marketdata/sector-flow';
  private readonly hotStocksUrl = '/api/marketdata/hot-stocks';
  private readonly marketMapUrl = '/api/marketdata/market-map';
  private readonly tickerMetadataUrl = '/api/marketdata/ticker-metadata';
  private readonly stockSummaryUrl = '/api/marketdata/stock-summary';
  private readonly tickerMetadataCache = new Map<string, TickerMetadata>();
  private readonly tickerMetadataQueried = new Set<string>();

  getTicker(symbol: string, startDate: string, endDate: string, adjusted = false): Observable<TickerOhlc[]> {
    const params: Record<string, string> = { symbol, startDate, endDate };
    if (adjusted) params['adjusted'] = 'true';
    return this.http.get<TickerOhlc[]>(this.baseUrl, {
      params,
    });
  }

  getStockSummary(symbol: string, date: string): Observable<StockSummary> {
    return this.http.get<StockSummary>(this.stockSummaryUrl, {
      params: { symbol, date },
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

  getTickerMetadata(symbols: string[]): Observable<TickerMetadata[]> {
    const normalized = [...new Set(symbols.map(symbol => symbol.trim().toUpperCase()).filter(Boolean))];
    const cached = normalized
      .map(symbol => this.tickerMetadataCache.get(symbol))
      .filter((item): item is TickerMetadata => !!item);
    const missing = normalized.filter(symbol => !this.tickerMetadataQueried.has(symbol));

    if (!missing.length) {
      return of(cached);
    }

    return this.http.get<TickerMetadata[]>(this.tickerMetadataUrl, {
      params: { symbols: missing.join(',') },
    }).pipe(
      tap(items => {
        for (const symbol of missing) {
          this.tickerMetadataQueried.add(symbol);
        }
        for (const item of items) {
          this.tickerMetadataCache.set(item.symbol, item);
        }
      }),
      map(() => {
        return normalized
          .map(symbol => this.tickerMetadataCache.get(symbol))
          .filter((item): item is TickerMetadata => !!item);
      }),
    );
  }
}
