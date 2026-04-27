import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TradingDateService {
  private readonly baseUrl = '/api/marketdata/trading-date';

  constructor(private readonly http: HttpClient) {}

  getLatestTradingDate(before: string): Observable<{ date: string }> {
    return this.http.get<{ date: string }>(this.baseUrl, {
      params: { before },
    });
  }
}
