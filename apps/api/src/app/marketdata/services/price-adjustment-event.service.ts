import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectTwStock } from 'nest-twstock';
import { TwStock } from 'node-twstock';
import { DateTime } from 'luxon';
import { Market } from '../enums';
import { PriceAdjustmentEvent } from '../schemas/price-adjustment-event.schema';
import { PriceAdjustmentEventRepository } from '../repositories/price-adjustment-event.repository';

@Injectable()
export class PriceAdjustmentEventService {
  constructor(
    @InjectTwStock() private readonly twstock: TwStock,
    private readonly repository: PriceAdjustmentEventRepository,
  ) {}

  async updatePriceAdjustmentEvents(date: string = DateTime.local().toISODate()) {
    const updates = [
      [this.updateTwseDividends, this.updateTpexDividends],
      [this.updateTwseCapitalReductions, this.updateTpexCapitalReductions],
      [this.updateTwseFaceValueChanges, this.updateTpexFaceValueChanges],
      [this.updateTwseEtfSplits, this.updateTpexEtfSplits],
      [this.updateTwseEtfReverseSplits, this.updateTpexEtfReverseSplits],
    ];

    for (const group of updates) {
      await Promise.all(group.map(update => update.call(this, date)));
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    Logger.log(`${date} price adjustment events updated`, PriceAdjustmentEventService.name);
  }

  @Cron('0 30 17 * * *')
  async updateTwseDividends(date: string = DateTime.local().toISODate()) {
    const events = await this.twstock.stocks.dividends({ startDate: date, endDate: date, exchange: 'TWSE' })
      .then(rows => rows.map(row => {
        const previousClose = row.previousClose;
        const referencePrice = row.referencePrice;
        const cashDividend = row.cashDividend || 0;
        const stockDividendShares = row.stockDividendShares || 0;
        const factor = (1 - cashDividend / previousClose) * (1 / (1 + stockDividendShares / 1000));
        if (!Number.isFinite(previousClose) || previousClose <= 0 || !Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(factor) || factor <= 0) return null;
        return {
          symbol: row.symbol,
          exchange: row.exchange,
          market: Market.TSE,
          eventType: 'dividend',
          effectiveDate: row.date,
          previousClose,
          referencePrice,
          factor: Number(factor.toPrecision(12)),
          cashDividend,
          stockDividendShares,
          raw: row as unknown as Record<string, unknown>,
        } as PriceAdjustmentEvent;
      }).filter((event): event is PriceAdjustmentEvent => !!event));
    await this.repository.upsertEvents(events);
    Logger.log(`${date} 上市除權息資料: 已更新 ${events.length} 筆`, PriceAdjustmentEventService.name);
  }

  @Cron('0 30 17 * * *')
  async updateTpexDividends(date: string = DateTime.local().toISODate()) {
    const events = await this.twstock.stocks.dividends({ startDate: date, endDate: date, exchange: 'TPEx' })
      .then(rows => rows.map(row => {
        const previousClose = row.previousClose;
        const referencePrice = row.referencePrice;
        const cashDividend = row.cashDividend || 0;
        const stockDividendShares = row.stockDividendShares || 0;
        const factor = (1 - cashDividend / previousClose) * (1 / (1 + stockDividendShares / 1000));
        if (!Number.isFinite(previousClose) || previousClose <= 0 || !Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(factor) || factor <= 0) return null;
        return {
          symbol: row.symbol,
          exchange: row.exchange,
          market: Market.OTC,
          eventType: 'dividend',
          effectiveDate: row.date,
          previousClose,
          referencePrice,
          factor: Number(factor.toPrecision(12)),
          cashDividend,
          stockDividendShares,
          raw: row as unknown as Record<string, unknown>,
        } as PriceAdjustmentEvent;
      }).filter((event): event is PriceAdjustmentEvent => !!event));
    await this.repository.upsertEvents(events);
    Logger.log(`${date} 上櫃除權息資料: 已更新 ${events.length} 筆`, PriceAdjustmentEventService.name);
  }

  @Cron('0 35 17 * * *')
  async updateTwseCapitalReductions(date: string = DateTime.local().toISODate()) {
    const events = await this.twstock.stocks.capitalReductions({ startDate: date, endDate: date, exchange: 'TWSE' })
      .then(rows => rows.map(row => {
        const previousClose = row.previousClose;
        const referencePrice = row.referencePrice;
        const factor = referencePrice / previousClose;
        if (!Number.isFinite(previousClose) || previousClose <= 0 || !Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(factor) || factor <= 0) return null;
        return {
          symbol: row.symbol,
          exchange: row.exchange,
          market: Market.TSE,
          eventType: 'capitalReduction',
          effectiveDate: row.resumeDate,
          previousClose,
          referencePrice,
          factor: Number(factor.toPrecision(12)),
          sharesPerThousand: row.sharesPerThousand,
          refundPerShare: row.refundPerShare,
          reason: row.reason,
          raw: row as unknown as Record<string, unknown>,
        } as PriceAdjustmentEvent;
      }).filter((event): event is PriceAdjustmentEvent => !!event));
    await this.repository.upsertEvents(events);
    Logger.log(`${date} 上市減資資料: 已更新 ${events.length} 筆`, PriceAdjustmentEventService.name);
  }

  @Cron('0 35 17 * * *')
  async updateTpexCapitalReductions(date: string = DateTime.local().toISODate()) {
    const events = await this.twstock.stocks.capitalReductions({ startDate: date, endDate: date, exchange: 'TPEx' })
      .then(rows => rows.map(row => {
        const previousClose = row.previousClose;
        const referencePrice = row.referencePrice;
        const factor = referencePrice / previousClose;
        if (!Number.isFinite(previousClose) || previousClose <= 0 || !Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(factor) || factor <= 0) return null;
        return {
          symbol: row.symbol,
          exchange: row.exchange,
          market: Market.OTC,
          eventType: 'capitalReduction',
          effectiveDate: row.resumeDate,
          previousClose,
          referencePrice,
          factor: Number(factor.toPrecision(12)),
          sharesPerThousand: row.sharesPerThousand,
          refundPerShare: row.refundPerShare,
          reason: row.reason,
          raw: row as unknown as Record<string, unknown>,
        } as PriceAdjustmentEvent;
      }).filter((event): event is PriceAdjustmentEvent => !!event));
    await this.repository.upsertEvents(events);
    Logger.log(`${date} 上櫃減資資料: 已更新 ${events.length} 筆`, PriceAdjustmentEventService.name);
  }

  @Cron('0 40 17 * * *')
  async updateTwseFaceValueChanges(date: string = DateTime.local().toISODate()) {
    const events = await this.twstock.stocks.splits({ startDate: date, endDate: date, exchange: 'TWSE' })
      .then(rows => rows.map(row => {
        const previousClose = row.previousClose;
        const referencePrice = row.referencePrice;
        const factor = referencePrice / previousClose;
        if (!Number.isFinite(previousClose) || previousClose <= 0 || !Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(factor) || factor <= 0) return null;
        return {
          symbol: row.symbol,
          exchange: row.exchange,
          market: Market.TSE,
          eventType: 'faceValueChange',
          effectiveDate: row.resumeDate,
          previousClose,
          referencePrice,
          factor: Number(factor.toPrecision(12)),
          raw: row as unknown as Record<string, unknown>,
        } as PriceAdjustmentEvent;
      }).filter((event): event is PriceAdjustmentEvent => !!event));
    await this.repository.upsertEvents(events);
    Logger.log(`${date} 上市股票面額變更資料: 已更新 ${events.length} 筆`, PriceAdjustmentEventService.name);
  }

  @Cron('0 40 17 * * *')
  async updateTpexFaceValueChanges(date: string = DateTime.local().toISODate()) {
    const events = await this.twstock.stocks.splits({ startDate: date, endDate: date, exchange: 'TPEx' })
      .then(rows => rows.map(row => {
        const previousClose = row.previousClose;
        const referencePrice = row.referencePrice;
        const factor = referencePrice / previousClose;
        if (!Number.isFinite(previousClose) || previousClose <= 0 || !Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(factor) || factor <= 0) return null;
        return {
          symbol: row.symbol,
          exchange: row.exchange,
          market: Market.OTC,
          eventType: 'faceValueChange',
          effectiveDate: row.resumeDate,
          previousClose,
          referencePrice,
          factor: Number(factor.toPrecision(12)),
          raw: row as unknown as Record<string, unknown>,
        } as PriceAdjustmentEvent;
      }).filter((event): event is PriceAdjustmentEvent => !!event));
    await this.repository.upsertEvents(events);
    Logger.log(`${date} 上櫃股票面額變更資料: 已更新 ${events.length} 筆`, PriceAdjustmentEventService.name);
  }

  @Cron('0 45 17 * * *')
  async updateTwseEtfSplits(date: string = DateTime.local().toISODate()) {
    const events = await this.twstock.stocks.etfSplits({ startDate: date, endDate: date, exchange: 'TWSE', reverseSplit: false })
      .then(rows => rows.map(row => {
        const previousClose = row.previousClose;
        const referencePrice = row.referencePrice;
        const factor = referencePrice / previousClose;
        if (!Number.isFinite(previousClose) || previousClose <= 0 || !Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(factor) || factor <= 0) return null;
        return {
          symbol: row.symbol,
          exchange: row.exchange,
          market: Market.TSE,
          eventType: 'etfSplit',
          effectiveDate: row.resumeDate,
          previousClose,
          referencePrice,
          factor: Number(factor.toPrecision(12)),
          raw: row as unknown as Record<string, unknown>,
        } as PriceAdjustmentEvent;
      }).filter((event): event is PriceAdjustmentEvent => !!event));
    await this.repository.upsertEvents(events);
    Logger.log(`${date} 上市 ETF 分割資料: 已更新 ${events.length} 筆`, PriceAdjustmentEventService.name);
  }

  @Cron('0 45 17 * * *')
  async updateTpexEtfSplits(date: string = DateTime.local().toISODate()) {
    const events = await this.twstock.stocks.etfSplits({ startDate: date, endDate: date, exchange: 'TPEx', reverseSplit: false })
      .then(rows => rows.map(row => {
        const previousClose = row.previousClose;
        const referencePrice = row.referencePrice;
        const factor = referencePrice / previousClose;
        if (!Number.isFinite(previousClose) || previousClose <= 0 || !Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(factor) || factor <= 0) return null;
        return {
          symbol: row.symbol,
          exchange: row.exchange,
          market: Market.OTC,
          eventType: 'etfSplit',
          effectiveDate: row.resumeDate,
          previousClose,
          referencePrice,
          factor: Number(factor.toPrecision(12)),
          raw: row as unknown as Record<string, unknown>,
        } as PriceAdjustmentEvent;
      }).filter((event): event is PriceAdjustmentEvent => !!event));
    await this.repository.upsertEvents(events);
    Logger.log(`${date} 上櫃 ETF 分割資料: 已更新 ${events.length} 筆`, PriceAdjustmentEventService.name);
  }

  @Cron('0 50 17 * * *')
  async updateTwseEtfReverseSplits(date: string = DateTime.local().toISODate()) {
    const events = await this.twstock.stocks.etfSplits({ startDate: date, endDate: date, exchange: 'TWSE', reverseSplit: true })
      .then(rows => rows.map(row => {
        const previousClose = row.previousClose;
        const referencePrice = row.referencePrice;
        const factor = referencePrice / previousClose;
        if (!Number.isFinite(previousClose) || previousClose <= 0 || !Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(factor) || factor <= 0) return null;
        return {
          symbol: row.symbol,
          exchange: row.exchange,
          market: Market.TSE,
          eventType: 'etfReverseSplit',
          effectiveDate: row.resumeDate,
          previousClose,
          referencePrice,
          factor: Number(factor.toPrecision(12)),
          raw: row as unknown as Record<string, unknown>,
        } as PriceAdjustmentEvent;
      }).filter((event): event is PriceAdjustmentEvent => !!event));
    await this.repository.upsertEvents(events);
    Logger.log(`${date} 上市 ETF 反分割資料: 已更新 ${events.length} 筆`, PriceAdjustmentEventService.name);
  }

  @Cron('0 50 17 * * *')
  async updateTpexEtfReverseSplits(date: string = DateTime.local().toISODate()) {
    const events = await this.twstock.stocks.etfSplits({ startDate: date, endDate: date, exchange: 'TPEx', reverseSplit: true })
      .then(rows => rows.map(row => {
        const previousClose = row.previousClose;
        const referencePrice = row.referencePrice;
        const factor = referencePrice / previousClose;
        if (!Number.isFinite(previousClose) || previousClose <= 0 || !Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(factor) || factor <= 0) return null;
        return {
          symbol: row.symbol,
          exchange: row.exchange,
          market: Market.OTC,
          eventType: 'etfReverseSplit',
          effectiveDate: row.resumeDate,
          previousClose,
          referencePrice,
          factor: Number(factor.toPrecision(12)),
          raw: row as unknown as Record<string, unknown>,
        } as PriceAdjustmentEvent;
      }).filter((event): event is PriceAdjustmentEvent => !!event));
    await this.repository.upsertEvents(events);
    Logger.log(`${date} 上櫃 ETF 反分割資料: 已更新 ${events.length} 筆`, PriceAdjustmentEventService.name);
  }
}
