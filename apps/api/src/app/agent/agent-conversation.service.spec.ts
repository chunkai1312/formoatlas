import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentConversationService } from './agent-conversation.service';

const deleteSession = vi.fn();
const deleteMany = vi.fn();
const deleteOne = vi.fn();
const findOne = vi.fn();

describe('AgentConversationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteSession.mockResolvedValue(undefined);
    deleteMany.mockResolvedValue({ deletedCount: 1 });
    deleteOne.mockResolvedValue({ deletedCount: 1 });
  });

  it('returns the owned Copilot session id', async () => {
    const userId = new Types.ObjectId().toString();
    const conversationId = new Types.ObjectId().toString();
    findOne.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(conversationDoc(userId, conversationId)),
    });

    const service = createService();
    const result = await service.getCopilotSessionId(userId, conversationId);

    expect(result).toBe(`formoatlas:user:${userId}:conversation:${conversationId}`);
  });

  it('deletes app-owned records and best-effort deletes the Copilot session', async () => {
    const userId = new Types.ObjectId().toString();
    const conversationId = new Types.ObjectId().toString();
    const conversation = conversationDoc(userId, conversationId);
    findOne.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(conversation),
    });

    const service = createService();
    await service.delete(userId, conversationId);

    expect(deleteMany).toHaveBeenCalledWith(expect.objectContaining({
      userId: expect.any(Types.ObjectId),
      conversationId: expect.any(Types.ObjectId),
    }));
    expect(deleteOne).toHaveBeenCalledWith(expect.objectContaining({
      _id: expect.any(Types.ObjectId),
      userId: expect.any(Types.ObjectId),
    }));
    expect(deleteSession).toHaveBeenCalledWith(conversation.copilotSessionId);
  });

  it('does not restore or fail app deletion when Copilot session cleanup fails', async () => {
    const userId = new Types.ObjectId().toString();
    const conversationId = new Types.ObjectId().toString();
    findOne.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(conversationDoc(userId, conversationId)),
    });
    deleteSession.mockRejectedValueOnce(new Error('cli unavailable'));

    const service = createService();

    await expect(service.delete(userId, conversationId)).resolves.toBeUndefined();
    expect(deleteMany).toHaveBeenCalled();
    expect(deleteOne).toHaveBeenCalled();
  });
});

function createService() {
  return new AgentConversationService(
    {
      findOne,
      deleteOne,
    } as any,
    {
      deleteMany,
    } as any,
    {
      deleteSession,
    } as any,
  );
}

function conversationDoc(userId: string, conversationId: string) {
  return {
    _id: new Types.ObjectId(conversationId),
    userId: new Types.ObjectId(userId),
    copilotSessionId: `formoatlas:user:${userId}:conversation:${conversationId}`,
    title: '研究',
    messageCount: 0,
    lastMessageAt: new Date('2026-04-24T00:00:00.000Z'),
  };
}
