import { ConflictException, Injectable } from '@nestjs/common';

@Injectable()
export class CopilotSessionLockService {
  private readonly lockedSessionIds = new Set<string>();

  async withLock<T>(sessionId: string, fn: () => Promise<T>): Promise<T> {
    if (this.lockedSessionIds.has(sessionId)) {
      throw new ConflictException('市場研究助理正在處理這個對話，請稍後再試');
    }

    this.lockedSessionIds.add(sessionId);
    try {
      return await fn();
    } finally {
      this.lockedSessionIds.delete(sessionId);
    }
  }
}
