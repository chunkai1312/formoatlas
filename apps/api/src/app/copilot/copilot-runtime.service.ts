import { Injectable, Logger, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import {
  CopilotClient,
  CopilotSession,
  type CopilotClientOptions,
  type ResumeSessionConfig,
  type SessionConfig,
} from '@github/copilot-sdk';

@Injectable()
export class CopilotRuntimeService implements OnModuleDestroy {
  private readonly logger = new Logger(CopilotRuntimeService.name);
  private client: CopilotClient | null = null;

  getModel(): string {
    return process.env.COPILOT_MODEL || 'gpt-5-mini';
  }

  async createEphemeralSession(config: SessionConfig): Promise<CopilotSession> {
    return this.getClient().createSession(config);
  }

  async createOrResumeSession(sessionId: string, config: ResumeSessionConfig): Promise<CopilotSession> {
    const client = this.getClient();

    try {
      return await client.resumeSession(sessionId, config);
    } catch (error) {
      this.logger.warn(`Copilot session resume failed; creating a new named session: ${error?.message ?? error}`);
      return client.createSession({
        ...config,
        sessionId,
      });
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.getClient().deleteSession(sessionId);
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) {
      return;
    }

    const client = this.client;
    this.client = null;
    const stopErrors = await client.stop().catch(error => [error]);
    for (const error of stopErrors) {
      this.logger.warn(`Copilot client cleanup failed: ${error?.message ?? error}`);
    }
  }

  private getClient(): CopilotClient {
    if (!this.client) {
      this.client = new CopilotClient(this.buildClientOptions());
    }
    return this.client;
  }

  private buildClientOptions(): CopilotClientOptions {
    const copilotCliUrl = process.env.COPILOT_CLI_URL;
    if (!copilotCliUrl) {
      throw new ServiceUnavailableException('Copilot CLI URL is not configured');
    }

    return {
      cliUrl: copilotCliUrl,
      logLevel: 'error',
    };
  }
}
