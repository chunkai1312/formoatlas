import { describe, expect, it } from 'vitest';
import { buildMarketResearchPrompt } from './market-research-agent.prompt';

describe('buildMarketResearchPrompt', () => {
  it('defaults to research mode', () => {
    const prompt = buildMarketResearchPrompt('今天市場如何？', '2026-04-24');

    expect(prompt).toContain('模式：研究');
  });

  it('frames scan mode around abnormalities and risk observations', () => {
    const prompt = buildMarketResearchPrompt('掃描今天市場', '2026-04-24', { route: 'home' }, 'scan');

    expect(prompt).toContain('模式：掃描');
    expect(prompt).toContain('異常');
    expect(prompt).toContain('風險');
  });

  it('frames stock mode with stock context', () => {
    const prompt = buildMarketResearchPrompt(
      '分析這檔',
      '2026-04-24',
      { route: 'stock-detail', market: 'TSE', symbol: '2330' },
      'stock',
    );

    expect(prompt).toContain('模式：個股');
    expect(prompt).toContain('目前頁面：stock-detail');
    expect(prompt).toContain('目前代號：2330');
  });
});
