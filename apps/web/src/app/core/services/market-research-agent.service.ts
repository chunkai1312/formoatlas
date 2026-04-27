import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MarketResearchQuery, MarketResearchResponse, MarketResearchStreamEvent } from '../models/market-research-agent.model';

@Injectable({ providedIn: 'root' })
export class MarketResearchAgentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/agent/market-research';

  query(request: MarketResearchQuery): Observable<MarketResearchResponse> {
    return this.http.post<MarketResearchResponse>(this.baseUrl, request);
  }

  queryStream(request: MarketResearchQuery): Observable<MarketResearchStreamEvent> {
    return new Observable<MarketResearchStreamEvent>((subscriber) => {
      const controller = new AbortController();

      fetch(`${this.baseUrl}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            throw new Error(`HTTP ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            buffer = this.consumeSseBuffer(buffer, subscriber);
          }

          if (buffer.trim()) {
            this.consumeSseBuffer(`${buffer}\n\n`, subscriber);
          }
          subscriber.complete();
        })
        .catch((error) => {
          if (controller.signal.aborted) {
            return;
          }
          subscriber.error(error);
        });

      return () => controller.abort();
    });
  }

  private consumeSseBuffer(buffer: string, subscriber: { next: (event: MarketResearchStreamEvent) => void }): string {
    const frames = buffer.split(/\n\n/);
    const remainder = frames.pop() ?? '';

    for (const frame of frames) {
      const dataLine = frame
        .split(/\n/)
        .find(line => line.startsWith('data: '));
      if (!dataLine) continue;

      try {
        subscriber.next(JSON.parse(dataLine.slice(6)) as MarketResearchStreamEvent);
      } catch {
        // Ignore malformed progress frames.
      }
    }

    return remainder;
  }
}
