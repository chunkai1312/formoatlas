import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { CopilotClient, CopilotSession, type CopilotClientOptions, type PermissionHandler } from '@github/copilot-sdk';
import { MarketResearchQueryDto } from './dto/market-research-query.dto';
import { MarketResearchAgentOutput, MarketResearchAgentOutputSchema } from './market-research-agent.schema';
import { buildMarketResearchPrompt, MARKET_RESEARCH_SYSTEM_PROMPT } from './market-research-agent.prompt';
import { MarketResearchAgentTools } from './market-research-agent.tools';
import { MarketResearchEventEmitter } from './market-research-agent.events';

const AGENT_TIMEOUT_MS = 120_000;
const MAX_TOOL_CALLS = 8;

@Injectable()
export class MarketResearchAgentService {
  private readonly logger = new Logger(MarketResearchAgentService.name);
  private readonly copilotModel = process.env.COPILOT_MODEL || 'gpt-5-mini';
  private readonly copilotCliUrl = process.env.COPILOT_CLI_URL;

  private readonly permissionHandler: PermissionHandler = (request) => {
    if (request.kind === 'custom-tool') {
      return { kind: 'approve-once' };
    }
    return {
      kind: 'reject',
      feedback: 'FormoAtlas market research agent only allows registered read-only market data tools.',
    };
  };

  constructor(private readonly agentTools: MarketResearchAgentTools) {}

  async query(input: MarketResearchQueryDto, emit?: MarketResearchEventEmitter): Promise<MarketResearchAgentOutput> {
    emit?.({ type: 'status', message: '正在建立市場研究 session' });
    const client = new CopilotClient(this.buildCopilotClientOptions());
    let session: CopilotSession | null = null;
    const toolState = { toolCalls: 0 };
    const tools = this.agentTools.createTools(toolState, { maxToolCalls: MAX_TOOL_CALLS }, emit);
    const toolNames = tools.map(tool => tool.name);

    try {
      session = await client.createSession({
        clientName: 'formoatlas-market-research-agent',
        model: this.copilotModel,
        tools,
        availableTools: toolNames,
        enableConfigDiscovery: false,
        systemMessage: {
          mode: 'append',
          content: MARKET_RESEARCH_SYSTEM_PROMPT,
        },
        onPermissionRequest: this.permissionHandler,
      });

      emit?.({ type: 'status', message: '正在理解問題並查詢必要資料' });
      const prompt = buildMarketResearchPrompt(input.question, input.date, input.context, input.mode ?? 'research');
      const firstResponse = await this.sendPrompt(session, prompt);
      const firstResult = this.parseAgentOutput(firstResponse);
      if (firstResult) {
        emit?.({ type: 'status', message: '答案已完成 schema validation' });
        return firstResult;
      }

      emit?.({ type: 'status', message: '正在修正輸出格式並重新驗證' });
      const retryResponse = await this.sendPrompt(
        session,
        `前一次回覆不是合法 JSON 或不符合 schema。請根據同一個問題重新輸出，只能回傳 JSON object，不要 markdown，不要額外文字。

原始問題與上下文：
${prompt}

前一次回覆：
${firstResponse}`,
      );
      const retryResult = this.parseAgentOutput(retryResponse);
      if (retryResult) {
        emit?.({ type: 'status', message: '答案已完成 schema validation' });
        return retryResult;
      }

      throw new Error('Copilot returned invalid market research JSON after retry');
    } catch (error) {
      this.logger.error(`Market research agent failed: ${error?.message ?? error}`);
      throw new ServiceUnavailableException('市場研究助理暫時無法使用，請稍後再試');
    } finally {
      if (session) {
        await session.disconnect().catch(error => {
          this.logger.warn(`Copilot session cleanup failed: ${error?.message ?? error}`);
        });
      }

      const stopErrors = await client.stop().catch(error => [error]);
      for (const error of stopErrors) {
        this.logger.warn(`Copilot client cleanup failed: ${error?.message ?? error}`);
      }
    }
  }

  private buildCopilotClientOptions(): CopilotClientOptions {
    if (!this.copilotCliUrl) {
      throw new Error('COPILOT_CLI_URL is not configured');
    }

    return {
      cliUrl: this.copilotCliUrl,
      logLevel: 'error',
    };
  }

  private async sendPrompt(session: CopilotSession, prompt: string): Promise<string> {
    const response = await session.sendAndWait({ prompt }, AGENT_TIMEOUT_MS);
    const content = response?.data.content?.trim();
    if (!content) {
      throw new Error('Copilot returned an empty response');
    }
    return content;
  }

  private parseAgentOutput(content: string): MarketResearchAgentOutput | null {
    const json = this.parseJsonObject(content);
    if (!json) {
      return null;
    }

    const result = MarketResearchAgentOutputSchema.safeParse(json);
    if (!result.success) {
      this.logger.warn(`Agent response schema validation failed: ${result.error.message}`);
      return null;
    }

    return result.data;
  }

  private parseJsonObject(content: string): unknown | null {
    const trimmed = content.trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1]?.trim();
    const candidates = [fenced, trimmed, this.sliceJsonObject(trimmed)].filter((value): value is string => !!value);

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate);
      } catch {
        // Try the next candidate.
      }
    }

    return null;
  }

  private sliceJsonObject(content: string): string | null {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      return null;
    }

    return content.slice(start, end + 1);
  }
}
