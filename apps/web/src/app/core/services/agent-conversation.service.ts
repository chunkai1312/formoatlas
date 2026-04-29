import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AgentConversationDetail,
  AgentConversationStreamEvent,
  AgentConversationSummary,
  CreateAgentConversationRequest,
} from '../models/agent-conversation.model';
import { MarketResearchQuery } from '../models/market-research-agent.model';

@Injectable({ providedIn: 'root' })
export class AgentConversationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/agent/conversations';

  readonly conversations = signal<AgentConversationSummary[]>([]);
  readonly currentConversation = signal<AgentConversationDetail | null>(null);
  readonly loaded = signal(false);

  loadConversations(): Observable<AgentConversationSummary[]> {
    return this.http.get<AgentConversationSummary[]>(this.baseUrl, { withCredentials: true }).pipe(
      tap(conversations => {
        this.conversations.set(conversations);
        this.loaded.set(true);
      }),
    );
  }

  create(request: CreateAgentConversationRequest = {}): Observable<AgentConversationSummary> {
    return this.http.post<AgentConversationSummary>(this.baseUrl, request, { withCredentials: true }).pipe(
      tap(conversation => {
        this.conversations.update(conversations => [conversation, ...conversations.filter(item => item.id !== conversation.id)]);
      }),
    );
  }

  loadDetail(id: string): Observable<AgentConversationDetail> {
    return this.http.get<AgentConversationDetail>(`${this.baseUrl}/${id}`, { withCredentials: true }).pipe(
      tap(conversation => this.currentConversation.set(conversation)),
    );
  }

  delete(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.baseUrl}/${id}`, { withCredentials: true }).pipe(
      tap(() => {
        this.conversations.update(conversations => conversations.filter(conversation => conversation.id !== id));
        if (this.currentConversation()?.id === id) {
          this.currentConversation.set(null);
        }
      }),
    );
  }

  sendMessageStream(conversationId: string, request: MarketResearchQuery): Observable<AgentConversationStreamEvent> {
    return new Observable<AgentConversationStreamEvent>((subscriber) => {
      const controller = new AbortController();

      fetch(`${this.baseUrl}/${conversationId}/messages/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(request),
        credentials: 'include',
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

  clear() {
    this.conversations.set([]);
    this.currentConversation.set(null);
    this.loaded.set(false);
  }

  private consumeSseBuffer(buffer: string, subscriber: { next: (event: AgentConversationStreamEvent) => void }): string {
    const frames = buffer.split(/\n\n/);
    const remainder = frames.pop() ?? '';

    for (const frame of frames) {
      const dataLine = frame
        .split(/\n/)
        .find(line => line.startsWith('data: '));
      if (!dataLine) continue;

      try {
        subscriber.next(JSON.parse(dataLine.slice(6)) as AgentConversationStreamEvent);
      } catch {
        // Ignore malformed progress frames.
      }
    }

    return remainder;
  }
}
