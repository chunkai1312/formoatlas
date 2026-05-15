import { describe, expect, it, vi } from 'vitest';
import { Exchange, Market, TickerType } from '../enums';
import { TickerService } from './ticker.service';

describe('TickerService margin trading ingestion', () => {
  it('updates TWSE equity tickers with margin trading data', async () => {
    const { service, twstock, tickerRepository } = createService([
      {
        date: '2026-05-12',
        exchange: 'TWSE',
        symbol: '2330',
        name: '台積電',
        marginBuy: 1209,
        marginSell: 2295,
        marginRedeem: 74,
        marginBalancePrev: 20547,
        marginBalance: 19387,
        marginQuota: 6482595,
        shortBuy: 56,
        shortSell: 284,
        shortRedeem: 101,
        shortBalancePrev: 1506,
        shortBalance: 1633,
        shortQuota: 6482595,
        offset: 7,
        note: '',
      },
    ]);

    await (service as any).updateTwseEquitiesMarginTrades('2026-05-12');

    expect(twstock.stocks.marginTrades).toHaveBeenCalledWith({ date: '2026-05-12', exchange: 'TWSE' });
    expect(tickerRepository.updateTicker).toHaveBeenCalledWith({
      date: '2026-05-12',
      type: TickerType.Equity,
      exchange: Exchange.TWSE,
      market: Market.TSE,
      symbol: '2330',
      marginTrading: {
        marginBuy: 1209,
        marginSell: 2295,
        marginRedeem: 74,
        marginBalancePrev: 20547,
        marginBalance: 19387,
        marginBalanceChange: -1160,
        marginQuota: 6482595,
        shortBuy: 56,
        shortSell: 284,
        shortRedeem: 101,
        shortBalancePrev: 1506,
        shortBalance: 1633,
        shortBalanceChange: 127,
        shortQuota: 6482595,
        offset: 7,
        note: '',
      },
    });
  });

  it('filters OTC warrant-like symbols when updating TPEx margin trading data', async () => {
    const { service, tickerRepository } = createService([
      {
        date: '2026-05-12',
        exchange: 'TPEx',
        symbol: '700001',
        name: '權證',
        marginBalancePrev: 1,
        marginBalance: 2,
        shortBalancePrev: 3,
        shortBalance: 4,
      },
      {
        date: '2026-05-12',
        exchange: 'TPEx',
        symbol: '6488',
        name: '環球晶',
        marginBuy: 10,
        marginSell: 5,
        marginRedeem: 0,
        marginBalancePrev: 100,
        marginBalance: 105,
        marginQuota: 1000,
        shortBuy: 1,
        shortSell: 3,
        shortRedeem: 0,
        shortBalancePrev: 20,
        shortBalance: 22,
        shortQuota: 1000,
        offset: 0,
        note: 'X',
      },
    ]);

    await (service as any).updateTpexEquitiesMarginTrades('2026-05-12');

    expect(tickerRepository.updateTicker).toHaveBeenCalledTimes(1);
    expect(tickerRepository.updateTicker).toHaveBeenCalledWith(expect.objectContaining({
      exchange: Exchange.TPEx,
      market: Market.OTC,
      symbol: '6488',
      marginTrading: expect.objectContaining({
        marginBalanceChange: 5,
        shortBalanceChange: 2,
        note: 'X',
      }),
    }));
  });
});

describe('TickerService institutional trading ingestion', () => {
  it('preserves TWSE institutional detail rows and keeps aggregate fields', async () => {
    const { service, twstock, tickerRepository } = createService(null, [
      institutionalRow({
        exchange: 'TWSE',
        institutional: [
          { investor: '外資及陸資(不含外資自營商)', totalBuy: 1000, totalSell: 200, difference: 800 },
          { investor: '外資自營商', totalBuy: 50, totalSell: 20, difference: 30 },
          { investor: '投信', totalBuy: 300, totalSell: 100, difference: 200 },
          { investor: '自營商', difference: -10 },
          { investor: '自營商(自行買賣)', totalBuy: 80, totalSell: 40, difference: 40 },
          { investor: '自營商(避險)', totalBuy: 10, totalSell: 60, difference: -50 },
          { investor: '三大法人', difference: 1020 },
        ],
      }),
    ]);
    tickerRepository.getPrevInstConsecutiveDaysBatch.mockResolvedValue(new Map([['2330', { fini: 2, sitc: -1 }]]));

    await (service as any).updateTwseEquitiesInstInvestorsTrades('2026-05-12');

    expect(twstock.stocks.institutional).toHaveBeenCalledWith({ date: '2026-05-12', exchange: 'TWSE' });
    expect(tickerRepository.updateTicker).toHaveBeenCalledWith(expect.objectContaining({
      date: '2026-05-12',
      type: TickerType.Equity,
      exchange: Exchange.TWSE,
      market: Market.TSE,
      symbol: '2330',
      institutionalTrading: {
        summary: {
          fini: { buy: 1050, sell: 220, net: 830, consecutiveDays: 3 },
          sitc: { buy: 300, sell: 100, net: 200, consecutiveDays: 1 },
          dealers: { buy: 90, sell: 100, net: -10 },
        },
        details: [
          { investor: '外資及陸資(不含外資自營商)', buy: 1000, sell: 200, net: 800 },
          { investor: '外資自營商', buy: 50, sell: 20, net: 30 },
          { investor: '投信', buy: 300, sell: 100, net: 200 },
          { investor: '自營商', buy: null, sell: null, net: -10 },
          { investor: '自營商(自行買賣)', buy: 80, sell: 40, net: 40 },
          { investor: '自營商(避險)', buy: 10, sell: 60, net: -50 },
          { investor: '三大法人', buy: null, sell: null, net: 1020 },
        ],
      },
    }));
    expect(tickerRepository.updateTicker.mock.calls[0][0]).not.toHaveProperty('instInvestors');
  });

  it('filters OTC warrants while preserving TPEx institutional detail rows', async () => {
    const { service, tickerRepository } = createService(null, [
      institutionalRow({ exchange: 'TPEx', symbol: '700001', name: '權證' }),
      institutionalRow({
        exchange: 'TPEx',
        symbol: '6488',
        name: '環球晶',
        institutional: [
          { investor: '外資及陸資', totalBuy: 400, totalSell: 100, difference: 300 },
          { investor: '投信', totalBuy: 10, totalSell: 20, difference: -10 },
          { investor: '自營商(自行買賣)', totalBuy: 2, totalSell: 1, difference: 1 },
        ],
      }),
    ]);
    tickerRepository.getPrevInstConsecutiveDaysBatch.mockResolvedValue(new Map());

    await (service as any).updateTpexEquitiesInstInvestorsTrades('2026-05-12');

    expect(tickerRepository.updateTicker).toHaveBeenCalledTimes(1);
    expect(tickerRepository.updateTicker).toHaveBeenCalledWith(expect.objectContaining({
      exchange: Exchange.TPEx,
      market: Market.OTC,
      symbol: '6488',
      institutionalTrading: expect.objectContaining({
        details: expect.arrayContaining([
          { investor: '外資及陸資', buy: 400, sell: 100, net: 300 },
        ]),
        summary: expect.objectContaining({
          fini: expect.objectContaining({ net: 300 }),
          sitc: expect.objectContaining({ net: -10 }),
          dealers: expect.objectContaining({ net: 1 }),
        }),
      }),
    }));
    expect(tickerRepository.updateTicker.mock.calls[0][0]).not.toHaveProperty('instInvestors');
  });
});

function createService(marginRows: any[] | null, institutionalRows: any[] | null = null) {
  const twstock = {
    stocks: {
      marginTrades: vi.fn().mockResolvedValue(marginRows),
      institutional: vi.fn().mockResolvedValue(institutionalRows),
    },
  };
  const tickerRepository = {
    updateTicker: vi.fn().mockResolvedValue(undefined),
    getPrevInstConsecutiveDaysBatch: vi.fn().mockResolvedValue(new Map()),
  };
  const service = new TickerService(twstock as any, tickerRepository as any, {} as any);

  return { service, twstock, tickerRepository };
}

function institutionalRow(overrides: Record<string, any> = {}) {
  return {
    date: '2026-05-12',
    exchange: 'TWSE',
    symbol: '2330',
    name: '台積電',
    institutional: [
      { investor: '外資及陸資(不含外資自營商)', totalBuy: 100, totalSell: 20, difference: 80 },
      { investor: '投信', totalBuy: 30, totalSell: 10, difference: 20 },
      { investor: '自營商(自行買賣)', totalBuy: 8, totalSell: 4, difference: 4 },
    ],
    ...overrides,
  };
}
