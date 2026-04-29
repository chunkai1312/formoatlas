import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MarketStats } from '../models/market-stats.model';

@Injectable({ providedIn: 'root' })
export class MarketStatsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/marketdata/market-stats';

  getMarketStats(startDate: string, endDate: string): Observable<MarketStats[]> {
    return this.http.get<MarketStats[]>(this.baseUrl, {
      params: { startDate, endDate },
    });
  }
}
