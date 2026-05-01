import { beforeEach, describe, expect, it, vi } from 'vitest';

const createSession = vi.fn();
const resumeSession = vi.fn();
const deleteSession = vi.fn();
const stop = vi.fn();
const CopilotClientMock = vi.fn().mockImplementation(function () {
  return {
  createSession,
  resumeSession,
  deleteSession,
  stop,
  };
});

vi.mock('@github/copilot-sdk', async () => {
  const actual = await vi.importActual<typeof import('@github/copilot-sdk')>('@github/copilot-sdk');
  return {
    ...actual,
    CopilotClient: CopilotClientMock,
  };
});

describe('CopilotRuntimeService', () => {
  beforeEach(() => {
    process.env.COPILOT_CLI_URL = 'localhost:4321';
    delete process.env.COPILOT_MODEL;
    vi.clearAllMocks();
    createSession.mockResolvedValue({ sessionId: 'session-1' });
    resumeSession.mockResolvedValue({ sessionId: 'session-1' });
    deleteSession.mockResolvedValue(undefined);
    stop.mockResolvedValue([]);
  });

  it('reuses one CopilotClient for multiple sessions', async () => {
    const { CopilotRuntimeService } = await import('./copilot-runtime.service');
    const service = new CopilotRuntimeService();

    await service.createEphemeralSession({ onPermissionRequest: vi.fn() });
    await service.createEphemeralSession({ onPermissionRequest: vi.fn() });

    expect(CopilotClientMock).toHaveBeenCalledTimes(1);
    expect(createSession).toHaveBeenCalledTimes(2);
    expect(CopilotClientMock).toHaveBeenCalledWith({ cliUrl: 'localhost:4321', logLevel: 'error' });
  });

  it('fails without COPILOT_CLI_URL before creating a session', async () => {
    const { CopilotRuntimeService } = await import('./copilot-runtime.service');
    delete process.env.COPILOT_CLI_URL;
    const service = new CopilotRuntimeService();

    await expect(service.createEphemeralSession({ onPermissionRequest: vi.fn() }))
      .rejects
      .toMatchObject({ status: 503 });
    expect(CopilotClientMock).not.toHaveBeenCalled();
  });

  it('resumes a named session and falls back to creating it when resume fails', async () => {
    const { CopilotRuntimeService } = await import('./copilot-runtime.service');
    const service = new CopilotRuntimeService();

    await service.createOrResumeSession('session-1', { onPermissionRequest: vi.fn() });
    resumeSession.mockRejectedValueOnce(new Error('not found'));
    await service.createOrResumeSession('session-2', { onPermissionRequest: vi.fn() });

    expect(resumeSession).toHaveBeenCalledWith('session-1', expect.any(Object));
    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'session-2' }));
  });

  it('stops the shared client on module destroy', async () => {
    const { CopilotRuntimeService } = await import('./copilot-runtime.service');
    const service = new CopilotRuntimeService();

    await service.createEphemeralSession({ onPermissionRequest: vi.fn() });
    await service.onModuleDestroy();

    expect(stop).toHaveBeenCalledTimes(1);
  });
});
