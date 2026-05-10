import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BacktestResult, RunBacktestRequest } from '../models/backtesting.model';

@Injectable({ providedIn: 'root' })
export class BacktestingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/backtesting/run';

  run(request: RunBacktestRequest): Observable<BacktestResult> {
    return this.http.post<BacktestResult>(this.baseUrl, request, { withCredentials: true });
  }
}
