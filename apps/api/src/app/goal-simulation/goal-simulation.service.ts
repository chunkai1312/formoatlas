import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { TickerRepository } from '../marketdata/repositories/ticker.repository';
import { AdjustedPriceService } from '../marketdata/services/adjusted-price.service';
import { RunGoalSimulationDto } from './dto/run-goal-simulation.dto';
import {
  GoalSimulationCandidateResult,
  GoalSimulationMetricSet,
  GoalSimulationResult,
} from './types/goal-simulation.types';

interface GoalCandle {
  date: string;
  close: number;
}

interface SimulationState {
  cash: number;
  shares: number;
  equityCurve: Array<{ date: string; equity: number }>;
  tradeRecords: GoalSimulationCandidateResult['tradeRecords'];
  warnings: string[];
}

interface ContributionEvent {
  index: number;
  date: string;
  amount: number;
}

interface Cashflow {
  date: string;
  amount: number;
}

const COST_ASSUMPTION: GoalSimulationResult['costAssumption'] = {
  mode: 'ignored',
  feeRate: null,
  taxRate: null,
  description: '第一版目標模擬尚未將手續費與證交稅納入權益曲線，結果為未扣交易成本的歷史情境估算。',
};

@Injectable()
export class GoalSimulationService {
  constructor(
    private readonly tickerRepository: TickerRepository,
    private readonly adjustedPriceService: AdjustedPriceService,
  ) {}

  async run(input: RunGoalSimulationDto): Promise<GoalSimulationResult> {
    this.validateInput(input);

    const symbol = input.universe.symbols[0].trim().toUpperCase();
    const endDate = input.endDate ?? DateTime.local().toISODate();
    const startDate = input.startDate ?? DateTime.fromISO(endDate ?? '').minus({ years: input.horizonYears }).toISODate();
    if (!startDate || !endDate || startDate > endDate) {
      throw new BadRequestException('目標模擬日期區間無效');
    }

    const rawRows = await this.tickerRepository.getOhlcBySymbol({ symbol, startDate, endDate });
    const rows = await this.adjustedPriceService.adjustOhlc(symbol, rawRows);
    const candles = this.toCandles(rows);
    if (candles.length < 2) {
      throw new BadRequestException(`找不到 ${symbol} 在目標年限內足夠的 OHLC 資料`);
    }

    const contributionSchedule = this.contributionSchedule(candles, input.monthlyContribution);
    const target = this.resolveTarget(input, candles, contributionSchedule);
    const candidates = [
      this.runBuyAndHoldCandidate(input, candles, contributionSchedule, target.targetAmount),
    ];
    const totalContributed = input.initialCapital + contributionSchedule.reduce((sum, event) => sum + event.amount, 0);

    return {
      universe: { type: 'single-symbol', symbols: [symbol] },
      requestedHorizonYears: input.horizonYears,
      requestedRange: { startDate, endDate },
      resolvedRange: {
        startDate: candles[0].date,
        endDate: candles[candles.length - 1].date,
      },
      target,
      cashflow: {
        initialCapital: input.initialCapital,
        monthlyContribution: input.monthlyContribution,
        contributionEvents: contributionSchedule.length,
        totalContributed,
      },
      costAssumption: COST_ASSUMPTION,
      candidates,
      warnings: [
        '本功能以單一歷史區間做情境模擬，達成率為期末權益總值相對目標金額的比例。',
        '模擬結果不構成投資建議，亦不保證未來績效。',
        '價格資料假設：目標模擬使用向後還原 OHLC，以降低除權息、減資、面額變更與 ETF 分割造成的價格跳空干擾。',
        COST_ASSUMPTION.description,
      ],
    };
  }

  private runBuyAndHoldCandidate(
    input: RunGoalSimulationDto,
    candles: GoalCandle[],
    contributionSchedule: ContributionEvent[],
    targetAmount: number,
  ): GoalSimulationCandidateResult {
    const state = this.simulateBuyAndHold(input, candles, contributionSchedule);
    const totalContributed = input.initialCapital + contributionSchedule.reduce((sum, event) => sum + event.amount, 0);
    const finalValue = state.equityCurve[state.equityCurve.length - 1]?.equity ?? input.initialCapital;
    const cashflows = this.investmentCashflows(input.initialCapital, candles, contributionSchedule, finalValue);
    const metrics = this.metrics(state.equityCurve, finalValue, totalContributed, cashflows);
    const drawdownCurve = this.drawdownCurve(state.equityCurve);
    const targetGap = finalValue - targetAmount;
    const warnings = [...state.warnings];
    if (metrics.annualizedReturnPct === null) {
      warnings.push('買進持有的 money-weighted 年化報酬無法計算或無法收斂。');
    }

    return {
      strategy: 'buy-and-hold',
      label: this.strategyLabel(),
      status: 'available',
      goalAttainmentRate: this.goalAttainmentRate(finalValue, targetAmount),
      projectedFinalValue: this.round(finalValue),
      targetGap: this.round(targetGap),
      metrics,
      equityCurve: state.equityCurve.map(point => ({ date: point.date, value: point.equity })),
      drawdownCurve,
      tradeRecords: state.tradeRecords,
      suggestions: this.suggestions(targetGap, input, metrics),
      warnings,
    };
  }

  private simulateBuyAndHold(
    input: RunGoalSimulationDto,
    candles: GoalCandle[],
    contributionSchedule: ContributionEvent[],
  ): SimulationState {
    const state: SimulationState = { cash: input.initialCapital, shares: 0, equityCurve: [], tradeRecords: [], warnings: [] };
    const contributionByIndex = this.contributionByIndex(contributionSchedule);

    candles.forEach((candle, index) => {
      if (index === 0) this.buyWithAvailableCash(state, candle, 'initial-capital');
      const contribution = contributionByIndex.get(index);
      if (contribution) {
        state.cash += contribution.amount;
        this.buyWithAvailableCash(state, candle, 'monthly-contribution');
      }
      state.equityCurve.push({ date: candle.date, equity: this.equity(state, candle.close) });
    });

    state.warnings.push('買進持有策略會在期初與每月第一個可用交易日盡量買進並持有。');
    return state;
  }

  private validateInput(input: RunGoalSimulationDto) {
    if (input.targetAmount === undefined && input.targetAnnualReturnPct === undefined) {
      throw new BadRequestException('targetAmount 與 targetAnnualReturnPct 至少需要提供一個');
    }
    if (input.universe?.type !== 'single-symbol' || input.universe.symbols?.length !== 1) {
      throw new BadRequestException('第一版目標模擬僅支援 single-symbol 且剛好一檔股票');
    }
    const symbol = input.universe.symbols[0]?.trim();
    if (!symbol) throw new BadRequestException('股票代號不得為空');
  }

  private resolveTarget(
    input: RunGoalSimulationDto,
    candles: GoalCandle[],
    contributionSchedule: ContributionEvent[],
  ): GoalSimulationResult['target'] {
    if (input.targetAmount !== undefined) {
      return {
        targetAmount: input.targetAmount,
        source: 'targetAmount',
        targetAnnualReturnPct: input.targetAnnualReturnPct,
      };
    }

    const annualRate = input.targetAnnualReturnPct!;
    const endDate = candles[candles.length - 1].date;
    const targetAmount = [
      { date: candles[0].date, amount: input.initialCapital },
      ...contributionSchedule,
    ].reduce((sum, cashflow) => {
      const years = this.yearFraction(cashflow.date, endDate);
      return sum + cashflow.amount * Math.pow(1 + annualRate / 100, years);
    }, 0);

    return {
      targetAmount: this.round(targetAmount),
      source: 'targetAnnualReturnPct',
      targetAnnualReturnPct: annualRate,
    };
  }

  private contributionSchedule(candles: GoalCandle[], monthlyContribution: number): ContributionEvent[] {
    const events: ContributionEvent[] = [];
    let previousMonth = candles[0].date.slice(0, 7);
    for (let index = 1; index < candles.length; index += 1) {
      const month = candles[index].date.slice(0, 7);
      if (month !== previousMonth) {
        if (monthlyContribution > 0) {
          events.push({ index, date: candles[index].date, amount: monthlyContribution });
        }
        previousMonth = month;
      }
    }
    return events;
  }

  private metrics(
    equityCurve: Array<{ date: string; equity: number }>,
    finalValue: number,
    totalContributed: number,
    cashflows: Cashflow[],
  ): GoalSimulationMetricSet {
    let peak = equityCurve[0]?.equity ?? totalContributed;
    let peakDate = equityCurve[0]?.date ?? '';
    let worstPeriod: GoalSimulationMetricSet['worstPeriod'] = null;

    for (const point of equityCurve) {
      if (point.equity > peak) {
        peak = point.equity;
        peakDate = point.date;
      }
      const drawdownPct = peak > 0 ? ((point.equity - peak) / peak) * 100 : 0;
      if (!worstPeriod || drawdownPct < worstPeriod.drawdownPct) {
        worstPeriod = {
          startDate: peakDate,
          endDate: point.date,
          drawdownPct: this.round(drawdownPct),
        };
      }
    }

    return {
      totalReturnPct: this.round(((finalValue - totalContributed) / totalContributed) * 100),
      annualizedReturnPct: this.xirr(cashflows),
      maxDrawdownPct: worstPeriod?.drawdownPct ?? 0,
      worstPeriod,
    };
  }

  private drawdownCurve(equityCurve: Array<{ date: string; equity: number }>): Array<{ date: string; drawdownPct: number }> {
    let peak = equityCurve[0]?.equity ?? 0;
    return equityCurve.map(point => {
      if (point.equity > peak) peak = point.equity;
      return {
        date: point.date,
        drawdownPct: peak > 0 ? this.round(((point.equity - peak) / peak) * 100) : 0,
      };
    });
  }

  private suggestions(
    targetGap: number,
    input: RunGoalSimulationDto,
    metrics: GoalSimulationMetricSet,
  ): string[] {
    const suggestions: string[] = [];
    if (targetGap < 0) {
      suggestions.push('此組合在歷史情境下未達目標，可提高每月投入、延長年限或降低目標金額。');
    } else {
      suggestions.push('此組合在歷史情境下達成目標，可再檢查最大回撤是否符合風險承受度。');
    }

    const tolerance = input.maxDrawdownTolerancePct;
    if (tolerance !== undefined && Math.abs(metrics.maxDrawdownPct) > tolerance) {
      suggestions.push('最大回撤超過容忍度，可提高現金保留、降低單一股票曝險或重新設定目標條件。');
    }
    return suggestions;
  }

  private goalAttainmentRate(finalValue: number, targetAmount: number): number {
    return targetAmount > 0 ? this.round((finalValue / targetAmount) * 100) : 0;
  }

  private buyWithAvailableCash(
    state: SimulationState,
    candle: GoalCandle,
    reason: 'initial-capital' | 'monthly-contribution',
  ) {
    const price = candle.close;
    const shares = Math.floor(state.cash / price);
    if (shares <= 0) return;
    const amount = shares * price;
    state.shares += shares;
    state.cash -= amount;
    state.tradeRecords.push({
      date: candle.date,
      action: 'buy',
      reason,
      price: this.round(price),
      shares,
      amount: this.round(amount),
      cashAfter: this.round(state.cash),
    });
  }

  private equity(state: SimulationState, close: number): number {
    return this.round(state.cash + state.shares * close);
  }

  private contributionByIndex(events: ContributionEvent[]): Map<number, ContributionEvent> {
    return new Map(events.map(event => [event.index, event]));
  }

  private investmentCashflows(
    initialCapital: number,
    candles: GoalCandle[],
    contributionSchedule: ContributionEvent[],
    finalValue: number,
  ): Cashflow[] {
    return [
      { date: candles[0].date, amount: -initialCapital },
      ...contributionSchedule.map(event => ({ date: event.date, amount: -event.amount })),
      { date: candles[candles.length - 1].date, amount: finalValue },
    ];
  }

  private xirr(cashflows: Cashflow[]): number | null {
    const hasPositive = cashflows.some(cashflow => cashflow.amount > 0);
    const hasNegative = cashflows.some(cashflow => cashflow.amount < 0);
    if (!hasPositive || !hasNegative) return null;

    const npv = (rate: number) => cashflows.reduce((sum, cashflow) => {
      const years = this.yearFraction(cashflows[0].date, cashflow.date);
      return sum + cashflow.amount / Math.pow(1 + rate, years);
    }, 0);

    let low = -0.9999;
    let high = 10;
    let lowValue = npv(low);
    let highValue = npv(high);
    let attempts = 0;
    while (lowValue * highValue > 0 && high < 1_000 && attempts < 8) {
      high *= 2;
      highValue = npv(high);
      attempts += 1;
    }
    if (!Number.isFinite(lowValue) || !Number.isFinite(highValue) || lowValue * highValue > 0) return null;

    for (let iteration = 0; iteration < 100; iteration += 1) {
      const mid = (low + high) / 2;
      const value = npv(mid);
      if (!Number.isFinite(value)) return null;
      if (Math.abs(value) < 0.0001) return this.round(mid * 100);
      if (lowValue * value <= 0) {
        high = mid;
        highValue = value;
      } else {
        low = mid;
        lowValue = value;
      }
    }

    const result = ((low + high) / 2) * 100;
    return Number.isFinite(result) ? this.round(result) : null;
  }

  private yearFraction(startDate: string, endDate: string): number {
    const start = DateTime.fromISO(startDate);
    const end = DateTime.fromISO(endDate);
    return Math.max(end.diff(start, 'days').days / 365.25, 0);
  }

  private toCandles(rows: Array<{ date: string; closePrice?: number | null }>): GoalCandle[] {
    return rows
      .flatMap(row => {
        const close = this.finiteNumber(row.closePrice);
        if (close === null || close <= 0) return [];
        return [{ date: row.date, close }];
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private strategyLabel(): string {
    return '買進持有';
  }

  private finiteNumber(value: unknown): number | null {
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }
}
