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

function createService(marginRows: any[] | null) {
  const twstock = {
    stocks: {
      marginTrades: vi.fn().mockResolvedValue(marginRows),
    },
  };
  const tickerRepository = {
    updateTicker: vi.fn().mockResolvedValue(undefined),
  };
  const service = new TickerService(twstock as any, tickerRepository as any, {} as any);

  return { service, twstock, tickerRepository };
}
