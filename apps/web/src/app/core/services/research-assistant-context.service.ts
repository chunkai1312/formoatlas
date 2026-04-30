import { Injectable, signal } from '@angular/core';
import { AssistantMode, MarketResearchContext } from '../models/market-research-agent.model';

@Injectable({ providedIn: 'root' })
export class ResearchAssistantContextService {
  readonly context = signal<MarketResearchContext>({});
  readonly requestedMode = signal<AssistantMode>('research');
  readonly requestedQuestion = signal<string | null>(null);
  readonly openRequestId = signal(0);

  setContext(context: MarketResearchContext) {
    this.context.set(context);
  }

  requestAssistant(options: {
    mode?: AssistantMode;
    question?: string;
    context?: MarketResearchContext;
  }) {
    if (options.context) {
      this.context.set(options.context);
    }
    this.requestedMode.set(options.mode ?? 'research');
    this.requestedQuestion.set(options.question ?? null);
    this.openRequestId.update(value => value + 1);
  }
}
