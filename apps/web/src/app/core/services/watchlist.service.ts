import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/user/watchlist';

  readonly watchList = signal<string[]>([]);
  readonly isPanelOpen = signal(false);

  openPanel() {
    this.isPanelOpen.set(true);
    this.load().subscribe();
  }

  closePanel() {
    this.isPanelOpen.set(false);
  }

  load(): Observable<string[]> {
    return this.http.get<string[]>(this.baseUrl, { withCredentials: true }).pipe(
      tap(list => this.watchList.set(list)),
    );
  }

  add(symbol: string): Observable<string[]> {
    return this.http.post<string[]>(`${this.baseUrl}/${symbol}`, {}, { withCredentials: true }).pipe(
      tap(list => this.watchList.set(list)),
    );
  }

  remove(symbol: string): Observable<string[]> {
    return this.http.delete<string[]>(`${this.baseUrl}/${symbol}`, { withCredentials: true }).pipe(
      tap(list => this.watchList.set(list)),
    );
  }
}
