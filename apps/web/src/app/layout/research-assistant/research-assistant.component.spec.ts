import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ResearchAssistantComponent } from './research-assistant.component';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { MarketResearchAgentService } from '../../core/services/market-research-agent.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';

class MockDashboardStateService {
  readonly selectedDate = signal('2026-04-24');
  readonly endDate = computed(() => this.selectedDate());
}

describe('ResearchAssistantComponent', () => {
  let fixture: ComponentFixture<ResearchAssistantComponent>;
  let agentService: { queryStream: ReturnType<typeof vi.fn> };
  let contextService: ResearchAssistantContextService;

  beforeEach(async () => {
    agentService = {
      queryStream: vi.fn().mockReturnValue(of(
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

    await TestBed.configureTestingModule({
      imports: [ResearchAssistantComponent],
      providers: [
        { provide: DashboardStateService, useClass: MockDashboardStateService },
        { provide: MarketResearchAgentService, useValue: agentService },
        ResearchAssistantContextService,
      ],
    }).compileComponents();

    contextService = TestBed.inject(ResearchAssistantContextService);
    contextService.setContext({ route: 'dashboard', market: 'TSE' });
    fixture = TestBed.createComponent(ResearchAssistantComponent);
    fixture.detectChanges();
  });

  it('opens the panel and submits selected date with page context', () => {
    const component = fixture.componentInstance;
    component.open();
    component.setQuestion('今天偏多的證據？');
    component.submit();

    expect(agentService.queryStream).toHaveBeenCalledWith({
      question: '今天偏多的證據？',
      date: '2026-04-24',
      context: { route: 'dashboard', market: 'TSE' },
    });
    expect(component.answer()?.summary).toBe('今日偏多。');
    expect(component.progressEvents()[0]).toMatchObject({ type: 'status' });
  });

  it('renders recoverable streaming errors', () => {
    agentService.queryStream.mockReturnValueOnce(of({ type: 'error', message: '市場研究助理暫時無法使用' }));
    const component = fixture.componentInstance;
    component.setQuestion('x');

    component.submit();

    expect(component.error()).toContain('暫時無法使用');
  });
});
