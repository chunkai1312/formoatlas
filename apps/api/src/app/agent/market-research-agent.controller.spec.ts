import { describe, expect, it, vi } from 'vitest';
import { MarketResearchAgentController } from './market-research-agent.controller';

describe('MarketResearchAgentController', () => {
  it('streams status and final events for a valid query', async () => {
    const answer = validAgentOutput();
    const agentService = {
      query: vi.fn().mockImplementation(async (_input, emit) => {
        emit({ type: 'status', message: 'processing' });
        return answer;
      }),
    };
    const controller = new MarketResearchAgentController(agentService as any);
    const response = createMockResponse();

    await controller.queryStream({ question: '今天偏多的證據？', date: '2026-04-24' }, response as any);

    expect(response.write.mock.calls.map(call => call[0]).join('')).toContain('event: status');
    expect(response.write.mock.calls.map(call => call[0]).join('')).toContain('event: final');
    expect(response.end).toHaveBeenCalled();
  });

  it('streams an error event when the agent fails', async () => {
    const agentService = {
      query: vi.fn().mockRejectedValue(new Error('boom')),
    };
    const controller = new MarketResearchAgentController(agentService as any);
    const response = createMockResponse();

    await controller.queryStream({ question: '今天偏多的證據？', date: '2026-04-24' }, response as any);

    const output = response.write.mock.calls.map(call => call[0]).join('');
    expect(output).toContain('event: error');
    expect(output).toContain('boom');
  });
});

function createMockResponse() {
  return {
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
  };
}

function validAgentOutput() {
  return {
    summary: '今日籌碼偏多但需留意量能。',
    keyFindings: [
      {
        title: '外資現貨支撐',
        detail: '外資現貨買超延續，提供多方主要證據。',
        evidenceIndexes: [0],
      },
    ],
    evidence: [
      {
        sourceType: 'market-stats',
        label: '外資買賣超',
        date: '2026-04-24',
      },
    ],
    followUpQuestions: ['類股資金流向是否同步？'],
    warnings: [],
  };
}
