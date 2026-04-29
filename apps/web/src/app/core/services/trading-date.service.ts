import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TradingDateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/marketdata/trading-date';

  getLatestTradingDate(before: string): Observable<{ date: string }> {
    return this.http.get<{ date: string }>(this.baseUrl, {
      params: { before },
    });
  }
}
