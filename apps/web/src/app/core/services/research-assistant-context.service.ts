import { Injectable, signal } from '@angular/core';
import { MarketResearchContext } from '../models/market-research-agent.model';

@Injectable({ providedIn: 'root' })
export class ResearchAssistantContextService {
  readonly context = signal<MarketResearchContext>({});

  setContext(context: MarketResearchContext) {
    this.context.set(context);
  }
}
