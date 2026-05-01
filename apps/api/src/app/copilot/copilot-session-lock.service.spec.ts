import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CopilotSessionLockService } from './copilot-session-lock.service';

describe('CopilotSessionLockService', () => {
  it('rejects concurrent work for the same session id', async () => {
    const service = new CopilotSessionLockService();
    let release!: () => void;
    const running = service.withLock('session-1', () => new Promise<void>(resolve => {
      release = resolve;
    }));

    await expect(service.withLock('session-1', vi.fn()))
      .rejects
      .toBeInstanceOf(ConflictException);

    release();
    await running;
  });

  it('allows concurrent work for different session ids', async () => {
    const service = new CopilotSessionLockService();

    await expect(Promise.all([
      service.withLock('session-1', async () => 'a'),
      service.withLock('session-2', async () => 'b'),
    ])).resolves.toEqual(['a', 'b']);
  });
});
