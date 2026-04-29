import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, toArray } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgentConversationService } from './agent-conversation.service';

describe('AgentConversationService', () => {
  let service: AgentConversationService;
  let http: HttpTestingController;

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AgentConversationService,
      ],
    });

    service = TestBed.inject(AgentConversationService);
    http = TestBed.inject(HttpTestingController);
  });

  it('loads conversation summaries with credentials', async () => {
    const promise = firstValueFrom(service.loadConversations());
    const req = http.expectOne('/api/agent/conversations');

    expect(req.request.withCredentials).toBe(true);
    req.flush([{ id: 'c1', title: '研究', messageCount: 2, lastMessageAt: '2026-04-24T00:00:00.000Z' }]);

    await promise;
    expect(service.conversations()[0].id).toBe('c1');
  });

  it('creates, loads, and deletes conversations', async () => {
    const createPromise = firstValueFrom(service.create({ title: '研究' }));
    const createReq = http.expectOne('/api/agent/conversations');
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.withCredentials).toBe(true);
    createReq.flush({ id: 'c1', title: '研究', messageCount: 0, lastMessageAt: '2026-04-24T00:00:00.000Z' });
    await createPromise;

    const detailPromise = firstValueFrom(service.loadDetail('c1'));
    const detailReq = http.expectOne('/api/agent/conversations/c1');
    expect(detailReq.request.withCredentials).toBe(true);
    detailReq.flush({ id: 'c1', title: '研究', messageCount: 0, lastMessageAt: '2026-04-24T00:00:00.000Z', messages: [] });
    await detailPromise;
    expect(service.currentConversation()?.id).toBe('c1');

    const deletePromise = firstValueFrom(service.delete('c1'));
    const deleteReq = http.expectOne('/api/agent/conversations/c1');
    expect(deleteReq.request.method).toBe('DELETE');
    expect(deleteReq.request.withCredentials).toBe(true);
    deleteReq.flush({ ok: true });
    await deletePromise;
    expect(service.currentConversation()).toBeNull();
  });

  it('streams conversation events with included credentials', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      body: streamFrom('data: {"type":"status","message":"processing"}\n\ndata: {"type":"final","answer":{"summary":"ok","keyFindings":[],"evidence":[],"followUpQuestions":[],"warnings":[]}}\n\n'),
    } as Response);

    const events = await firstValueFrom(service.sendMessageStream('c1', {
      question: '今天偏多嗎？',
      date: '2026-04-24',
    }).pipe(toArray()));

    expect(fetchMock).toHaveBeenCalledWith('/api/agent/conversations/c1/messages/stream', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }));
    expect(events.map(event => event.type)).toEqual(['status', 'final']);
  });
});

function streamFrom(value: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(value));
      controller.close();
    },
  });
}
