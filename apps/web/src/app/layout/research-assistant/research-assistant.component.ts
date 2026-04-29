import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { MarketResearchAgentService } from '../../core/services/market-research-agent.service';
import { ResearchAssistantContextService } from '../../core/services/research-assistant-context.service';
import { AuthService } from '../../core/services/auth.service';
import { MarketResearchResponse, MarketResearchStreamEvent } from '../../core/models/market-research-agent.model';

@Component({
  selector: 'app-research-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './research-assistant.component.html',
  styleUrl: './research-assistant.component.scss',
})
export class ResearchAssistantComponent {
  private readonly dashboardState = inject(DashboardStateService);
  private readonly agentService = inject(MarketResearchAgentService);
  private readonly contextService = inject(ResearchAssistantContextService);
  private readonly authService = inject(AuthService);

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly isOpen = signal(false);
  readonly question = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly answer = signal<MarketResearchResponse | null>(null);
  readonly progressEvents = signal<MarketResearchStreamEvent[]>([]);
  readonly context = this.contextService.context;
  readonly selectedDate = this.dashboardState.selectedDate;
  private streamSubscription: Subscription | null = null;

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

  open() {
    this.isOpen.set(true);
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
    this.submit();
  }

  submit() {
    const question = this.question().trim();
    if (!question || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.answer.set(null);
    this.progressEvents.set([]);
    this.streamSubscription?.unsubscribe();

    this.streamSubscription = this.agentService.queryStream({
      question,
      date: this.selectedDate(),
      context: this.context(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: event => this.handleStreamEvent(event),
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) {
            this.error.set('問題或日期格式不正確，請調整後再試。');
            return;
          }
          if (error.status === 503 || error.status === 504) {
            this.error.set('市場研究助理暫時無法使用，請稍後再試。');
            return;
          }
          this.error.set(`研究助理請求失敗 (${error.status})`);
        },
      });
  }

  private handleStreamEvent(event: MarketResearchStreamEvent) {
    if (event.type !== 'final') {
      this.progressEvents.update(events => [...events, event]);
    }

    if (event.type === 'final') {
      this.answer.set(event.answer);
      return;
    }

    if (event.type === 'error') {
      this.error.set(event.message || '市場研究助理暫時無法使用，請稍後再試。');
    }
  }

  evidenceLabel(index: number): string {
    const evidence = this.answer()?.evidence[index];
    if (!evidence) return `證據 ${index + 1}`;
    return evidence.label;
  }

  progressLabel(event: MarketResearchStreamEvent): string {
    if (event.type === 'tool_start') return `查詢 ${event.toolName}`;
    if (event.type === 'tool_result') return event.ok ? `${event.toolName} 完成` : `${event.toolName} 失敗`;
    if (event.type === 'final') return '答案完成';
    return event.message;
  }
}
