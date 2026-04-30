import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendAndWait = vi.fn();
const disconnect = vi.fn();
const stop = vi.fn();
const createSession = vi.fn();

vi.mock('@github/copilot-sdk', async () => {
  const actual = await vi.importActual<typeof import('@github/copilot-sdk')>('@github/copilot-sdk');
  return {
    ...actual,
    CopilotClient: vi.fn().mockImplementation(function () {
      return {
        createSession,
        stop,
      };
    }),
  };
});

describe('MarketResearchAgentService', () => {
  beforeEach(() => {
    process.env.COPILOT_CLI_URL = 'localhost:4321';
    vi.clearAllMocks();
    createSession.mockResolvedValue({ sendAndWait, disconnect });
    stop.mockResolvedValue([]);
    disconnect.mockResolvedValue(undefined);
  });

  it('returns validated structured output from Copilot', async () => {
    const { MarketResearchAgentService } = await import('./market-research-agent.service');
    sendAndWait.mockResolvedValueOnce({
      data: {
        content: JSON.stringify(validAgentOutput()),
      },
    });

    const service = new MarketResearchAgentService({ createTools: () => [] } as any);
    const result = await service.query({ question: '今天偏多的證據？', date: '2026-04-24' });

    expect(result.summary).toBe('今日籌碼偏多但需留意量能。');
    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({
      availableTools: [],
      clientName: 'formoatlas-market-research-agent',
    }));
  });

  it('includes assistant mode framing in the prompt', async () => {
    const { MarketResearchAgentService } = await import('./market-research-agent.service');
    sendAndWait.mockResolvedValueOnce({
      data: {
        content: JSON.stringify(validAgentOutput()),
      },
    });

    const service = new MarketResearchAgentService({ createTools: () => [] } as any);
    await service.query({
      question: '分析這檔',
      date: '2026-04-24',
      mode: 'stock',
      context: { route: 'stock-detail', market: 'TSE', symbol: '2330' },
    });

    expect(sendAndWait).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('模式：個股'),
      }),
      expect.any(Number),
    );
    expect(sendAndWait).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('目前代號：2330'),
      }),
      expect.any(Number),
    );
  });

  it('emits status events during a streaming query', async () => {
    const { MarketResearchAgentService } = await import('./market-research-agent.service');
    sendAndWait.mockResolvedValueOnce({
      data: {
        content: JSON.stringify(validAgentOutput()),
      },
    });
    const emit = vi.fn();

    const service = new MarketResearchAgentService({ createTools: () => [] } as any);
    await service.query({ question: '今天偏多的證據？', date: '2026-04-24' }, emit);

    expect(emit).toHaveBeenCalledWith({ type: 'status', message: '正在建立市場研究 session' });
    expect(emit).toHaveBeenCalledWith({ type: 'status', message: '答案已完成 schema validation' });
  });

  it('retries once after invalid output', async () => {
    const { MarketResearchAgentService } = await import('./market-research-agent.service');
    sendAndWait
      .mockResolvedValueOnce({ data: { content: 'not json' } })
      .mockResolvedValueOnce({ data: { content: JSON.stringify(validAgentOutput()) } });

    const service = new MarketResearchAgentService({ createTools: () => [] } as any);
    const result = await service.query({ question: '今天偏多的證據？', date: '2026-04-24' });

    expect(result.keyFindings).toHaveLength(1);
    expect(sendAndWait).toHaveBeenCalledTimes(2);
  });

  it('fails after retrying invalid output', async () => {
    const { MarketResearchAgentService } = await import('./market-research-agent.service');
    sendAndWait
      .mockResolvedValueOnce({ data: { content: 'not json' } })
      .mockResolvedValueOnce({ data: { content: '{}' } });

    const service = new MarketResearchAgentService({ createTools: () => [] } as any);

    await expect(service.query({ question: '今天偏多的證據？', date: '2026-04-24' }))
      .rejects
      .toMatchObject({ status: 503 });
  });

  it('rejects non-market permission requests', async () => {
    const { MarketResearchAgentService } = await import('./market-research-agent.service');
    const service = new MarketResearchAgentService({ createTools: () => [] } as any);

    const result = (service as any).permissionHandler({ kind: 'shell' }, { sessionId: 'session' });

    expect(result).toMatchObject({ kind: 'reject' });
  });
});

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
