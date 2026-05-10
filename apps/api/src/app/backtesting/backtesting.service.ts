import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import {
  Backtest,
  EquityCurveColumn,
  Stats,
  StatsIndex,
  Strategy,
  TradeLogColumn,
} from 'node-backtesting';
import type { Candle } from 'node-backtesting';
import { AdjustedPriceService } from '../marketdata/services/adjusted-price.service';
import { TickerRepository } from '../marketdata/repositories/ticker.repository';
import { RunBacktestDto } from './dto/run-backtest.dto';
import { BuyAndHoldStrategy } from './strategies/buy-and-hold.strategy';
import { SmaCrossStrategy } from './strategies/sma-cross.strategy';
import { BacktestResult, BacktestStrategy } from './types/backtest-result.types';

const DEFAULT_FEE_RATE = 0.001425;
const DEFAULT_TAX_RATE = 0.003;
const DEFAULT_YEARS = 5;

@Injectable()
export class BacktestingService {
  constructor(
    private readonly tickerRepository: TickerRepository,
    private readonly adjustedPriceService: AdjustedPriceService,
  ) {}

  async runBacktest(input: RunBacktestDto): Promise<BacktestResult> {
    const symbol = input.symbol.trim().toUpperCase();
    if (!symbol) throw new BadRequestException('股票代號不得為空');

    const endDate = input.endDate ?? DateTime.local().toISODate();
    const startDate = input.startDate ?? DateTime.fromISO(endDate).minus({ years: DEFAULT_YEARS }).toISODate();
    if (!startDate || !endDate || startDate > endDate) {
      throw new BadRequestException('回測日期區間無效');
    }

    const params = input.params ?? {};
    this.validateStrategyParams(input.strategy, params);

    const rawRows = await this.tickerRepository.getOhlcBySymbol({ symbol, startDate, endDate });
    const rows = await this.adjustedPriceService.adjustOhlc(symbol, rawRows);
    const data = this.toHistoricalData(rows);
    if (!data.length) {
      throw new BadRequestException(`找不到 ${symbol} 在指定區間內的 OHLC 資料`);
    }
    this.validateStrategyInput(input.strategy, params, data.length);

    const feeRate = input.feeRate ?? DEFAULT_FEE_RATE;
    const taxRate = input.taxRate ?? DEFAULT_TAX_RATE;
    const effectiveCommissionRate = feeRate + (taxRate / 2);
    const tradeOnClose = input.tradeOnClose ?? true;

    const output = await this.runStrategy({
      data,
      strategy: input.strategy,
      initialCash: input.initialCash,
      effectiveCommissionRate,
      tradeOnClose,
      params,
    });

    const benchmark = input.strategy === 'sma-cross'
      ? await this.runStrategy({
          data,
          strategy: 'buy-and-hold',
          initialCash: input.initialCash,
          effectiveCommissionRate,
          tradeOnClose,
          params: {},
        })
      : undefined;

    return {
      symbol,
      strategy: input.strategy,
      requestedRange: { startDate, endDate },
      resolvedRange: {
        startDate: data[0].date,
        endDate: data[data.length - 1].date,
      },
      params: {
        initialCash: input.initialCash,
        shortWindow: params.shortWindow,
        longWindow: params.longWindow,
        orderSize: params.orderSize,
        feeRate,
        taxRate,
        effectiveCommissionRate,
        tradeOnClose,
      },
      metrics: output.metrics,
      equityCurve: output.equityCurve,
      drawdownCurve: output.drawdownCurve,
      trades: output.trades,
      benchmark: benchmark
        ? {
            strategy: 'buy-and-hold',
            metrics: benchmark.metrics,
            equityCurve: benchmark.equityCurve,
            drawdownCurve: benchmark.drawdownCurve,
            trades: benchmark.trades,
          }
        : undefined,
      warnings: [
        '回測結果為歷史資料模擬，不構成投資建議，亦不保證未來績效。',
        input.strategy === 'buy-and-hold'
          ? '買進持有策略會在期初建立一筆長部位並持有到期末；未指定股數時，以初始資金盡量買滿。'
          : 'SMA 策略結果會同時回傳買進持有 benchmark，供使用者比較策略是否優於單純持有。',
        `成交假設：${tradeOnClose ? '以收盤價成交' : '以下一根 K 棒開盤價成交'}，以股為交易單位，不限制整張。`,
        `交易成本假設：手續費率 ${feeRate}、證交稅率 ${taxRate}；目前回測引擎以有效雙邊 commission ${effectiveCommissionRate} 近似交易成本。`,
        '價格資料假設：回測使用向後還原 OHLC，以降低除權息、減資、面額變更與 ETF 分割造成的價格跳空干擾。',
      ],
    };
  }

  private validateStrategyParams(strategy: BacktestStrategy, params: RunBacktestDto['params']) {
    if (strategy === 'buy-and-hold') return;
    if (!params?.shortWindow || !params.longWindow || !params.orderSize) {
      throw new BadRequestException('SMA cross 策略需要 shortWindow、longWindow 與 orderSize');
    }
    if (params.shortWindow >= params.longWindow) {
      throw new BadRequestException('短期均線週期必須小於長期均線週期');
    }
  }

  private validateStrategyInput(strategy: BacktestStrategy, params: RunBacktestDto['params'], dataLength: number) {
    if (dataLength < 2) {
      throw new BadRequestException('歷史資料不足以執行回測');
    }

    if (strategy === 'buy-and-hold') return;

    if (dataLength < params!.longWindow!) {
      throw new BadRequestException('歷史資料不足以執行該策略參數');
    }
  }

  private async runStrategy(options: {
    data: Candle[];
    strategy: BacktestStrategy;
    initialCash: number;
    effectiveCommissionRate: number;
    tradeOnClose: boolean;
    params: NonNullable<RunBacktestDto['params']>;
  }) {
    const StrategyClass = options.strategy === 'buy-and-hold' ? BuyAndHoldStrategy : SmaCrossStrategy;
    const backtest = new Backtest(options.data, StrategyClass as new (...args: any[]) => Strategy, {
      cash: options.initialCash,
      commission: options.effectiveCommissionRate,
      tradeOnClose: options.tradeOnClose,
      exclusiveOrders: true,
    });
    const stats = await backtest.run({ params: this.nodeBacktestingParams(options.strategy, options.params) });
    return this.normalizeStats(stats, options.initialCash);
  }

  private nodeBacktestingParams(strategy: BacktestStrategy, params: NonNullable<RunBacktestDto['params']>): Record<string, number> {
    if (strategy === 'buy-and-hold') {
      return params.orderSize ? { orderSize: params.orderSize } : {};
    }

    return {
      shortWindow: params.shortWindow!,
      longWindow: params.longWindow!,
      orderSize: params.orderSize!,
    };
  }

  private normalizeStats(stats: Stats, initialCash: number) {
    const results = stats.results;
    if (!results || !stats.equityCurve || !stats.tradeLog) {
      throw new BadRequestException('回測結果產生失敗');
    }

    return {
      metrics: {
        finalEquity: this.finiteNumber(results[StatsIndex.EquityFinal]) ?? initialCash,
        totalReturnPct: this.finiteNumber(results[StatsIndex.Return]) ?? 0,
        annualizedReturnPct: this.finiteNumber(results[StatsIndex.ReturnAnn]),
        maxDrawdownPct: this.finiteNumber(results[StatsIndex.MaxDrawdown]),
        winRatePct: this.finiteNumber(results[StatsIndex.WinRate]),
        tradeCount: this.finiteNumber(results[StatsIndex.Trades]) ?? 0,
        buyHoldReturnPct: this.finiteNumber(results[StatsIndex.BuyAndHoldReturn]),
      },
      equityCurve: stats.equityCurve.map(row => ({
        date: row.date,
        equity: this.finiteNumber(row[EquityCurveColumn.Equity]) ?? 0,
      })),
      drawdownCurve: stats.equityCurve.map(row => ({
        date: row.date,
        drawdownPct: this.finiteNumber(row[EquityCurveColumn.DrawdownPct]) ?? 0,
      })),
      trades: stats.tradeLog.map(row => ({
        entryDate: row[TradeLogColumn.EntryTime],
        exitDate: row[TradeLogColumn.ExitTime] || undefined,
        entryPrice: this.finiteNumber(row[TradeLogColumn.EntryPrice]) ?? 0,
        exitPrice: this.finiteNumber(row[TradeLogColumn.ExitPrice]) ?? undefined,
        size: Math.abs(this.finiteNumber(row[TradeLogColumn.Size]) ?? 0),
        pnl: this.finiteNumber(row[TradeLogColumn.PnL]) ?? undefined,
        returnPct: this.finiteNumber(row[TradeLogColumn.ReturnPct]) ?? undefined,
      })),
    };
  }

  private toHistoricalData(rows: Array<{
    date: string;
    openPrice?: number | null;
    highPrice?: number | null;
    lowPrice?: number | null;
    closePrice?: number | null;
    tradeVolume?: number | null;
  }>): Candle[] {
    return rows.flatMap(row => {
      const open = this.finiteNumber(row.openPrice);
      const high = this.finiteNumber(row.highPrice);
      const low = this.finiteNumber(row.lowPrice);
      const close = this.finiteNumber(row.closePrice);
      if (open === null || high === null || low === null || close === null) return [];
      return [{
        date: row.date,
        open,
        high,
        low,
        close,
        volume: this.finiteNumber(row.tradeVolume) ?? 0,
      }];
    });
  }

  private finiteNumber(value: unknown): number | null {
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
}
