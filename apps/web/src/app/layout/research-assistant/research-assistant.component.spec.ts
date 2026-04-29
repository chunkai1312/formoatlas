import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ResearchAssistantComponent } from './research-assistant.component';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { AgentConversationService } from '../../core/services/agent-conversation.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';
import { AuthService } from '../../core/services/auth.service';
import { AgentConversationDetail, AgentConversationSummary } from '../../core/models/agent-conversation.model';

class MockDashboardStateService {
  readonly selectedDate = signal('2026-04-24');
  readonly endDate = computed(() => this.selectedDate());
}

describe('ResearchAssistantComponent', () => {
  let fixture: ComponentFixture<ResearchAssistantComponent>;
  let conversationService: ReturnType<typeof createConversationService>;
  let contextService: ResearchAssistantContextService;
  let loggedIn: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    loggedIn = signal(true);
    conversationService = createConversationService();

    await TestBed.configureTestingModule({
      imports: [ResearchAssistantComponent],
      providers: [
        { provide: DashboardStateService, useClass: MockDashboardStateService },
        { provide: AgentConversationService, useValue: conversationService },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: computed(() => loggedIn()),
            login: vi.fn(),
          },
        },
        ResearchAssistantContextService,
      ],
    }).compileComponents();

    contextService = TestBed.inject(ResearchAssistantContextService);
    contextService.setContext({ route: 'market-overview', market: 'TSE' });
    fixture = TestBed.createComponent(ResearchAssistantComponent);
    fixture.detectChanges();
  });

  it('loads recent conversation history on init', () => {
    expect(conversationService.loadConversations).toHaveBeenCalled();
    expect(conversationService.loadDetail).toHaveBeenCalledWith('c1');
    expect(fixture.componentInstance.currentConversation()?.messages[0].question).toBe('前一個問題');
  });

  it('submits selected date and page context to the current conversation', () => {
    const component = fixture.componentInstance;
    component.setQuestion('今天偏多的證據？');

    component.submit();

    expect(conversationService.sendMessageStream).toHaveBeenCalledWith('c1', {
      question: '今天偏多的證據？',
      date: '2026-04-24',
      context: { route: 'market-overview', market: 'TSE' },
    });
    expect(component.progressEvents()[0]).toMatchObject({ type: 'status' });
    expect(conversationService.loadDetail).toHaveBeenCalledWith('c1');
  });

  it('creates a conversation before submitting when no thread is selected', () => {
    conversationService.currentConversation.set(null);
    const component = fixture.componentInstance;
    component.setQuestion('今天偏多的證據？');

    component.submit();

    expect(conversationService.create).toHaveBeenCalledWith({ context: { route: 'market-overview', market: 'TSE' } });
    expect(conversationService.sendMessageStream).toHaveBeenCalledWith('c2', expect.objectContaining({
      question: '今天偏多的證據？',
    }));
  });

  it('renders recoverable streaming errors and reloads failed messages', () => {
    conversationService.sendMessageStream.mockReturnValueOnce(of({ type: 'error', message: '市場研究助理暫時無法使用' }));
    const component = fixture.componentInstance;
    component.setQuestion('x');

    component.submit();

    expect(component.error()).toContain('暫時無法使用');
    expect(conversationService.loadDetail).toHaveBeenCalledWith('c1');
  });

  it('starts new conversations and deletes the current one', () => {
    const component = fixture.componentInstance;

    component.newConversation();
    expect(conversationService.create).toHaveBeenCalledWith({ context: { route: 'market-overview', market: 'TSE' } });
    expect(conversationService.loadDetail).toHaveBeenCalledWith('c2');

    conversationService.currentConversation.set(conversationDetail('c1'));
    component.deleteCurrentConversation();
    expect(conversationService.delete).toHaveBeenCalledWith('c1');
  });

  it('keeps conversation data unloaded for logged-out users', async () => {
    TestBed.resetTestingModule();
    loggedIn = signal(false);
    conversationService = createConversationService();

    await TestBed.configureTestingModule({
      imports: [ResearchAssistantComponent],
      providers: [
        { provide: DashboardStateService, useClass: MockDashboardStateService },
        { provide: AgentConversationService, useValue: conversationService },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: computed(() => loggedIn()),
            login: vi.fn(),
          },
        },
        ResearchAssistantContextService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchAssistantComponent);
    fixture.detectChanges();

    expect(conversationService.loadConversations).not.toHaveBeenCalled();
  });
});

function createConversationService() {
  const conversations = signal<AgentConversationSummary[]>([
    { id: 'c1', title: '前一個問題', messageCount: 2, lastMessageAt: '2026-04-24T00:00:00.000Z' },
  ]);
  const currentConversation = signal<AgentConversationDetail | null>(null);
  const loaded = signal(false);

  const service = {
    conversations,
    currentConversation,
    loaded,
    loadConversations: vi.fn().mockImplementation(() => {
      loaded.set(true);
      return of(conversations());
    }),
    create: vi.fn().mockImplementation(() => {
      const conversation = { id: 'c2', title: '新對話', messageCount: 0, lastMessageAt: '2026-04-24T00:00:00.000Z' };
      conversations.update(items => [conversation, ...items]);
      return of(conversation);
    }),
    loadDetail: vi.fn().mockImplementation((id: string) => {
      const detail = conversationDetail(id);
      currentConversation.set(detail);
      return of(detail);
    }),
    delete: vi.fn().mockImplementation((id: string) => {
      conversations.update(items => items.filter(item => item.id !== id));
      if (currentConversation()?.id === id) {
        currentConversation.set(null);
      }
      return of({ ok: true });
    }),
    sendMessageStream: vi.fn().mockReturnValue(of(
      { type: 'status', message: '正在查詢資料' },
      {
        type: 'final',
        answer: {
          summary: '今日偏多。',
          keyFindings: [
            { title: '外資支撐', detail: '外資買超延續。', evidenceIndexes: [0] },
          ],
          evidence: [
            { sourceType: 'market-stats', label: '外資買賣超', date: '2026-04-24' },
          ],
          followUpQuestions: ['類股是否同步？'],
          warnings: [],
        },
      },
    )),
  };

  return service;
}

function conversationDetail(id: string): AgentConversationDetail {
  return {
    id,
    title: id === 'c1' ? '前一個問題' : '新對話',
    messageCount: 2,
    lastMessageAt: '2026-04-24T00:00:00.000Z',
    messages: [
      {
        id: `${id}-m1`,
        role: 'user',
        status: 'completed',
        question: '前一個問題',
        date: '2026-04-24',
        context: { route: 'market-overview', market: 'TSE' },
        createdAt: '2026-04-24T00:00:00.000Z',
      },
      {
        id: `${id}-m2`,
        role: 'assistant',
        status: 'completed',
        date: '2026-04-24',
        context: { route: 'market-overview', market: 'TSE' },
        createdAt: '2026-04-24T00:01:00.000Z',
        answer: {
          summary: '今日偏多。',
          keyFindings: [
            { title: '外資支撐', detail: '外資買超延續。', evidenceIndexes: [0] },
          ],
          evidence: [
            { sourceType: 'market-stats', label: '外資買賣超', date: '2026-04-24' },
          ],
          followUpQuestions: ['類股是否同步？'],
          warnings: [],
        },
      },
    ],
  };
}
