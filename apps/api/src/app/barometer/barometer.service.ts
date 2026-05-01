import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { CopilotSession, type PermissionHandler } from '@github/copilot-sdk';
import { CopilotRuntimeService } from '../copilot/copilot-runtime.service';
import { MarketStatsRepository } from '../marketdata/repositories/market-stats.repository';
import { BAROMETER_LABEL, BAROMETER_WEATHER, BarometerLevel, BarometerResult } from './barometer.types';
import { BarometerOutput, BarometerOutputSchema } from './barometer.schema';
import { SYSTEM_PROMPT, buildUserMessage, TechContext } from './barometer.prompt';

@Injectable()
export class BarometerService {
  private readonly logger = new Logger(BarometerService.name);
  private readonly denyCopilotToolPermission: PermissionHandler = () => ({ kind: 'reject' });

  constructor(
    private readonly marketStatsRepository: MarketStatsRepository,
    private readonly copilotRuntime: CopilotRuntimeService,
  ) {}

  async generateAnalysis(date: string = DateTime.local().toISODate()): Promise<BarometerResult> {
    // 1. 取當日資料，不存在則回傳 404
    const [todayStats] = await this.marketStatsRepository.getMarketStats({
      startDate: date,
      endDate: date,
    });

    if (!todayStats) {
      throw new NotFoundException(`找不到 ${date} 的市場數據`);
    }

    // 2. 快取命中直接回傳
    if (todayStats.aiAnalysis) {
      this.logger.log(`${date} 晴雨表：命中快取`);
      return {
        date,
        level: todayStats.aiAnalysis.level as BarometerLevel,
        weather: todayStats.aiAnalysis.weather,
        label: todayStats.aiAnalysis.label,
        summary: todayStats.aiAnalysis.summary,
      };
    }

    // 3. 取前一交易日資料（用於趨勢對比）及歷史資料（用於計算技術指標）
    const prevDateStr = DateTime.fromISO(date).minus({ days: 30 }).toISODate();
    const recentStats = await this.marketStatsRepository.getMarketStats({
      startDate: prevDateStr,
      endDate: date,
    });
    const prevStats = [...recentStats].reverse().find(s => s.date < date) ?? null;
    const historicalStats = recentStats.filter(s => s.date < date);
    const techContext = this.computeTechContext(historicalStats, todayStats);

    // 4. 呼叫 LLM
    try {
      const result = await this.generateCopilotAnalysis(buildUserMessage(todayStats, prevStats, techContext));

      const level = result.level as BarometerLevel;
      const aiAnalysis = {
        level,
        weather: BAROMETER_WEATHER[level],
        label: BAROMETER_LABEL[level],
        summary: result.summary,
      };

      // 5. 寫入快取
      await this.marketStatsRepository.updateMarketStats({ date, aiAnalysis });
      this.logger.log(`${date} 晴雨表：分析完成，等級 ${level}`);

      return { date, ...aiAnalysis };
    } catch (error) {
      this.logger.error(`${date} 晴雨表：LLM 呼叫失敗`, error?.message);
      throw new ServiceUnavailableException('晴雨表分析服務暫時無法使用，請稍後再試');
    }
  }

  private async generateCopilotAnalysis(userMessage: string): Promise<BarometerOutput> {
    let session: CopilotSession | null = null;

    try {
      session = await this.copilotRuntime.createEphemeralSession({
        clientName: 'formoatlas-barometer',
        model: this.copilotRuntime.getModel(),
        availableTools: [],
        tools: [],
        systemMessage: {
          mode: 'append',
          content: `${SYSTEM_PROMPT}

你只能回傳一個 JSON object，不要使用 markdown，不要加入解釋文字。JSON 必須符合：
{"level":"STRONG_BULL|BULL|NEUTRAL|BEAR|STRONG_BEAR","summary":"繁體中文摘要"}`,
        },
        onPermissionRequest: this.denyCopilotToolPermission,
      });

      const firstResponse = await this.sendCopilotPrompt(session, this.buildCopilotPrompt(userMessage));
      const firstResult = this.parseCopilotAnalysis(firstResponse);
      if (firstResult) {
        return firstResult;
      }

      const retryResponse = await this.sendCopilotPrompt(
        session,
        `前一次回覆不是合法 JSON 或不符合 schema。請根據原始資料重新輸出，只能回傳 JSON object，不要 markdown，不要說明。

原始資料：
${userMessage}

前一次回覆：
${firstResponse}`,
      );
      const retryResult = this.parseCopilotAnalysis(retryResponse);
      if (retryResult) {
        return retryResult;
      }

      throw new Error('Copilot returned invalid barometer JSON after retry');
    } finally {
      if (session) {
        await session.disconnect().catch(error => {
          this.logger.warn(`Copilot session cleanup failed: ${error?.message ?? error}`);
        });
      }
    }
  }

  private buildCopilotPrompt(userMessage: string): string {
    return `${userMessage}

再次提醒：請只輸出符合 schema 的 JSON object，禁止 markdown code fence，禁止額外文字。`;
  }

  private async sendCopilotPrompt(session: CopilotSession, prompt: string): Promise<string> {
    const response = await session.sendAndWait({ prompt }, 120_000);
    const content = response?.data.content?.trim();
    if (!content) {
      throw new Error('Copilot returned an empty response');
    }

    return content;
  }

  private parseCopilotAnalysis(content: string): BarometerOutput | null {
    const json = this.parseJsonObject(content);
    if (!json) {
      return null;
    }

    const result = BarometerOutputSchema.safeParse(json);
    if (!result.success) {
      this.logger.warn(`Copilot response schema validation failed: ${result.error.message}`);
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

  private computeTechContext(historicalStats: Record<string, any>[], todayStats: Record<string, any>): TechContext {
    const sorted = [...historicalStats].sort((a, b) => b.date.localeCompare(a.date));
    const prices = [todayStats.taiexPrice, ...sorted.map(s => s.taiexPrice)].filter((p): p is number => p != null);
    const volumes = [todayStats.taiexTradeValue, ...sorted.map(s => s.taiexTradeValue)].filter((v): v is number => v != null);

    const avg = (arr: number[]) => arr.reduce((sum, v) => sum + v, 0) / arr.length;

    const taiex5MA = prices.length >= 5 ? Math.round(avg(prices.slice(0, 5))) : null;
    const taiex20MA = prices.length >= 20 ? Math.round(avg(prices.slice(0, 20))) : null;
    const tradeValue5MA = volumes.length >= 5 ? Math.round(avg(volumes.slice(0, 5))) : null;
    const volumeRatio =
      tradeValue5MA != null && todayStats.taiexTradeValue != null
        ? Math.round((todayStats.taiexTradeValue / tradeValue5MA) * 100) / 100
        : null;

    return { taiex5MA, taiex20MA, tradeValue5MA, volumeRatio };
  }

  @Cron('0 0 17 * * *')
  async scheduledAnalysis() {
    const date = DateTime.local().toISODate();
    this.logger.log(`排程執行晴雨表分析 ${date}`);
    try {
      await this.generateAnalysis(date);
      this.logger.log(`排程晴雨表分析 ${date} 完成`);
    } catch (error) {
      this.logger.error(`排程晴雨表分析 ${date} 失敗：${error?.message}`);
    }
  }
}
