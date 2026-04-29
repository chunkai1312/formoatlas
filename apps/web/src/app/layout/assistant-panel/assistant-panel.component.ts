import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, finalize, map, of, switchMap } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { LoginRequiredSurfaceComponent } from '../login-required-surface/login-required-surface.component';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { AgentConversationService } from '../../core/services/agent-conversation.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequiredService } from '../../core/services/login-required.service';
import {
  AgentConversationMessage,
  AgentConversationSummary,
} from '../../core/models/agent-conversation.model';
import {
  MarketResearchContext,
  MarketResearchResponse,
  MarketResearchStreamEvent,
} from '../../core/models/market-research-agent.model';

type AssistantView = 'list' | 'session';

@Component({
  selector: 'app-assistant-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, LoginRequiredSurfaceComponent],
  templateUrl: './assistant-panel.component.html',
  styleUrl: './assistant-panel.component.scss',
})
export class AssistantPanelComponent implements OnInit {
  private readonly dashboardState = inject(DashboardStateService);
  private readonly conversationService = inject(AgentConversationService);
  private readonly contextService = inject(ResearchAssistantContextService);
  private readonly authService = inject(AuthService);
  private readonly loginRequired = inject(LoginRequiredService);

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly conversations = this.conversationService.conversations;
  readonly currentConversation = this.conversationService.currentConversation;
  readonly isOpen = signal(false);
  readonly assistantView = signal<AssistantView>('list');
  readonly question = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly progressEvents = signal<MarketResearchStreamEvent[]>([]);
  readonly context = this.contextService.context;
  readonly selectedDate = this.dashboardState.selectedDate;
  private streamSubscription: Subscription | null = null;
  private loadSubscription: Subscription | null = null;
  @ViewChild('questionInput')
  private questionInput?: ElementRef<HTMLTextAreaElement>;

  readonly contextLabel = computed(() => {
    const context = this.context();
    const parts = [
      context.route,
      context.market,
      context.symbol,
      context.sector,
    ].filter(Boolean);
    return parts.length ? parts.join(' / ') : '全域市場';
  });

  ngOnInit() {
    if (this.isLoggedIn()) {
      this.loadConversationList();
    }
  }

  open() {
    if (!this.isLoggedIn()) {
      this.loginRequired.open();
      return;
    }

    this.isOpen.set(true);
    this.assistantView.set('list');
    if (!this.conversationService.loaded()) {
      this.loadConversationList();
    }
  }

  close() {
    this.isOpen.set(false);
  }

  login() {
    this.authService.login();
  }

  setQuestion(value: string) {
    this.question.set(value);
  }

  useFollowUp(question: string) {
    this.question.set(question);
    this.error.set(null);
    this.progressEvents.set([]);
    queueMicrotask(() => this.questionInput?.nativeElement.focus());
  }

  submit() {
    const question = this.question().trim();
    if (!question || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.progressEvents.set([]);
    this.streamSubscription?.unsubscribe();

    this.streamSubscription = this.ensureCurrentConversationId()
      .pipe(
        switchMap((conversationId) =>
          this.conversationService.sendMessageStream(conversationId, {
            question,
            date: this.selectedDate(),
            context: this.context(),
          }),
        ),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (event) => this.handleStreamEvent(event),
        error: (error: HttpErrorResponse | Error) => {
          this.handleRequestError(error);
        },
      });
  }

  newConversation() {
    if (!this.isLoggedIn()) {
      return;
    }

    this.error.set(null);
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = this.conversationService
      .create({ context: this.context() })
      .pipe(
        switchMap((conversation) =>
          this.conversationService.loadDetail(conversation.id),
        ),
      )
      .subscribe({
        next: () => this.assistantView.set('session'),
        error: () => this.error.set('無法建立新對話，請稍後再試。'),
      });
  }

  selectConversation(conversation: AgentConversationSummary) {
    if (this.currentConversation()?.id === conversation.id) {
      this.assistantView.set('session');
      return;
    }

    this.error.set(null);
    this.progressEvents.set([]);
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = this.conversationService
      .loadDetail(conversation.id)
      .subscribe({
        next: () => this.assistantView.set('session'),
        error: () => this.error.set('無法載入對話，請稍後再試。'),
      });
  }

  showConversationList() {
    this.assistantView.set('list');
    this.error.set(null);
    this.progressEvents.set([]);
    if (this.isLoggedIn() && !this.conversationService.loaded()) {
      this.loadConversationList();
    }
  }

  deleteCurrentConversation() {
    const conversation = this.currentConversation();
    if (!conversation) {
      return;
    }

    this.error.set(null);
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = this.conversationService
      .delete(conversation.id)
      .pipe(switchMap(() => this.conversationService.loadConversations()))
      .subscribe({
        next: () => {
          this.assistantView.set('list');
          this.progressEvents.set([]);
        },
        error: () => this.error.set('無法刪除對話，請稍後再試。'),
      });
  }

  private ensureCurrentConversationId() {
    const current = this.currentConversation();
    if (current) {
      return of(current.id);
    }

    return this.conversationService.create({ context: this.context() }).pipe(
      switchMap((conversation) =>
        this.conversationService.loadDetail(conversation.id).pipe(
          map(() => {
            this.assistantView.set('session');
            return conversation.id;
          }),
        ),
      ),
    );
  }

  private loadConversationList() {
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = this.conversationService
      .loadConversations()
      .subscribe({
        error: () => this.error.set('無法載入對話紀錄，請稍後再試。'),
      });
  }

  private reloadCurrentConversation() {
    const conversation = this.currentConversation();
    if (!conversation) {
      return;
    }

    this.conversationService.loadDetail(conversation.id).subscribe();
    this.conversationService.loadConversations().subscribe();
  }

  private handleRequestError(error: HttpErrorResponse | Error) {
    if ('status' in error && error.status === 400) {
      this.error.set('問題或日期格式不正確，請調整後再試。');
      return;
    }
    if ('status' in error && (error.status === 503 || error.status === 504)) {
      this.error.set('市場研究助理暫時無法使用，請稍後再試。');
      return;
    }
    if ('status' in error) {
      this.error.set(`研究助理請求失敗 (${error.status})`);
      return;
    }
    this.error.set('研究助理請求失敗');
  }

  private handleStreamEvent(event: MarketResearchStreamEvent) {
    if (event.type !== 'final') {
      this.progressEvents.update((events) => [...events, event]);
    }

    if (event.type === 'final') {
      this.question.set('');
      this.reloadCurrentConversation();
      return;
    }

    if (event.type === 'error') {
      this.error.set(event.message || '市場研究助理暫時無法使用，請稍後再試。');
      this.reloadCurrentConversation();
    }
  }

  messageContextLabel(message: AgentConversationMessage): string {
    return [message.date, this.contextLabelFor(message.context)]
      .filter(Boolean)
      .join(' / ');
  }

  contextLabelFor(context?: MarketResearchContext): string {
    const parts = [
      context?.route,
      context?.market,
      context?.symbol,
      context?.sector,
    ].filter(Boolean);
    return parts.length ? parts.join(' / ') : '全域市場';
  }

  conversationContextLabel(conversation: AgentConversationSummary): string {
    return this.contextLabelFor(conversation.contextSnapshot);
  }

  evidenceLabel(answer: MarketResearchResponse, index: number): string {
    const evidence = answer.evidence[index];
    if (!evidence) return `證據 ${index + 1}`;
    return evidence.label;
  }

  progressLabel(event: MarketResearchStreamEvent): string {
    if (event.type === 'tool_start') return `查詢 ${event.toolName}`;
    if (event.type === 'tool_result')
      return event.ok ? `${event.toolName} 完成` : `${event.toolName} 失敗`;
    if (event.type === 'final') return '答案完成';
    return event.message;
  }
}
