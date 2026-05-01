import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgentConversationController } from './agent-conversation.controller';

describe('AgentConversationController', () => {
  it('is protected by JwtAuthGuard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AgentConversationController);
    expect(guards).toContain(JwtAuthGuard);
  });

  it('delegates list/create/detail/delete with the authenticated user id', async () => {
    const conversationService = createConversationService();
    const controller = new AgentConversationController(conversationService as any, {} as any, createSessionLock() as any);
    const req = createReq('user-1');

    await controller.list(req as any);
    await controller.create(req as any, { title: '研究' });
    await controller.detail(req as any, 'conversation-1');
    await controller.delete(req as any, 'conversation-1');

    expect(conversationService.list).toHaveBeenCalledWith('user-1');
    expect(conversationService.create).toHaveBeenCalledWith('user-1', { title: '研究' });
    expect(conversationService.detail).toHaveBeenCalledWith('user-1', 'conversation-1');
    expect(conversationService.delete).toHaveBeenCalledWith('user-1', 'conversation-1');
  });

  it('streams and persists a successful conversation-scoped answer', async () => {
    const answer = validAgentOutput();
    const conversationService = createConversationService();
    const agentService = {
      query: vi.fn().mockImplementation(async (_input, emit) => {
        emit({ type: 'status', message: 'processing' });
        return answer;
      }),
    };
    const sessionLock = createSessionLock();
    const controller = new AgentConversationController(conversationService as any, agentService as any, sessionLock as any);
    const response = createMockResponse();
    const body = { question: '今天偏多的證據？', date: '2026-04-24' };

    await controller.streamMessage(createReq('user-1') as any, 'conversation-1', body, response as any);

    const output = response.write.mock.calls.map(call => call[0]).join('');
    expect(conversationService.getCopilotSessionId).toHaveBeenCalledWith('user-1', 'conversation-1');
    expect(conversationService.recordUserMessage).toHaveBeenCalledWith('user-1', 'conversation-1', body);
    expect(sessionLock.withLock).toHaveBeenCalledWith('copilot-session-1', expect.any(Function));
    expect(agentService.query).toHaveBeenCalledWith(body, expect.any(Function), 'copilot-session-1');
    expect(conversationService.recordAssistantSuccess).toHaveBeenCalledWith('user-1', 'conversation-1', body, answer);
    expect(output).toContain('event: final');
    expect(response.end).toHaveBeenCalled();
  });

  it('streams and persists a failed assistant message', async () => {
    const conversationService = createConversationService();
    const agentService = {
      query: vi.fn().mockRejectedValue(new Error('boom')),
    };
    const controller = new AgentConversationController(conversationService as any, agentService as any, createSessionLock() as any);
    const response = createMockResponse();
    const body = { question: '今天偏多的證據？', date: '2026-04-24' };

    await controller.streamMessage(createReq('user-1') as any, 'conversation-1', body, response as any);

    const output = response.write.mock.calls.map(call => call[0]).join('');
    expect(conversationService.recordAssistantFailure).toHaveBeenCalledWith('user-1', 'conversation-1', body, 'boom');
    expect(output).toContain('event: error');
    expect(output).toContain('boom');
    expect(response.end).toHaveBeenCalled();
  });
});

function createConversationService() {
  return {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: 'conversation-1' }),
    detail: vi.fn().mockResolvedValue({ id: 'conversation-1', messages: [] }),
    delete: vi.fn().mockResolvedValue(undefined),
    ensureOwned: vi.fn().mockResolvedValue(undefined),
    getCopilotSessionId: vi.fn().mockResolvedValue('copilot-session-1'),
    recordUserMessage: vi.fn().mockResolvedValue({ id: 'message-1' }),
    recordAssistantSuccess: vi.fn().mockResolvedValue({ id: 'message-2' }),
    recordAssistantFailure: vi.fn().mockResolvedValue({ id: 'message-2' }),
  };
}

function createSessionLock() {
  return {
    withLock: vi.fn((_sessionId: string, fn: () => Promise<unknown>) => fn()),
  };
}

function createReq(userId: string) {
  return { user: { sub: userId } };
}

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
