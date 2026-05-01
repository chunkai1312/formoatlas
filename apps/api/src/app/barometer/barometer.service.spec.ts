import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BarometerService } from './barometer.service';

const sendAndWait = vi.fn();
const disconnect = vi.fn();
const createEphemeralSession = vi.fn();
const getModel = vi.fn();

describe('BarometerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createEphemeralSession.mockResolvedValue({ sendAndWait, disconnect });
    getModel.mockReturnValue('gpt-5-mini');
    disconnect.mockResolvedValue(undefined);
  });

  it('uses the shared runtime for an ephemeral Copilot session', async () => {
    sendAndWait.mockResolvedValueOnce({
      data: {
        content: JSON.stringify({ level: 'BULL', summary: '籌碼偏多。' }),
      },
    });

    const service = createService();
    const result = await (service as any).generateCopilotAnalysis('市場資料');

    expect(result).toEqual({ level: 'BULL', summary: '籌碼偏多。' });
    expect(createEphemeralSession).toHaveBeenCalledWith(expect.objectContaining({
      clientName: 'formoatlas-barometer',
      availableTools: [],
      tools: [],
    }));
    expect(disconnect).toHaveBeenCalled();
  });

  it('retries once after invalid Copilot JSON', async () => {
    sendAndWait
      .mockResolvedValueOnce({ data: { content: 'not json' } })
      .mockResolvedValueOnce({ data: { content: JSON.stringify({ level: 'NEUTRAL', summary: '中性。' }) } });

    const service = createService();
    const result = await (service as any).generateCopilotAnalysis('市場資料');

    expect(result.level).toBe('NEUTRAL');
    expect(sendAndWait).toHaveBeenCalledTimes(2);
  });
});

function createService() {
  return new BarometerService(
    {} as any,
    {
      createEphemeralSession,
      getModel,
    } as any,
  );
}
