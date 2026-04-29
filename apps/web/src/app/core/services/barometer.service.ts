import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BarometerResult } from '../models/barometer.model';

@Injectable({ providedIn: 'root' })
export class BarometerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/marketdata/barometer';

  getBarometer(date: string): Observable<BarometerResult> {
    return this.http.get<BarometerResult>(this.baseUrl, {
      params: { date },
    });
  }
}
