import { Injectable, signal, computed } from '@angular/core';
import { TimeRange } from '../../core/services/dashboard-state.service';

@Injectable()
export class SectorFlowStateService {
  readonly selectedSymbol = signal<string>('');
  readonly selectedName = signal<string>('');
  readonly localRange = signal<TimeRange>('1M');
  readonly sectors = signal<{ symbol: string; name: string }[]>([]);
  readonly klineSymbol = signal<string | undefined>(undefined);
  readonly activeMarket = signal<'TSE' | 'OTC'>('TSE');

  readonly benchmarkSymbol = computed(() =>
    this.activeMarket() === 'OTC' ? 'IX0043' : 'IX0001'
  );

  readonly benchmarkName = computed(() =>
    this.activeMarket() === 'OTC' ? '櫃買指數' : '加權指數'
  );
}
