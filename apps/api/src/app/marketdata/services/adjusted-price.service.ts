import { Injectable } from '@nestjs/common';
import { PriceAdjustmentEventRepository } from '../repositories/price-adjustment-event.repository';

export interface OhlcRow {
  date: string;
  openPrice?: number | null;
  highPrice?: number | null;
  lowPrice?: number | null;
  closePrice?: number | null;
  tradeVolume?: number | null;
  tradeValue?: number | null;
  tradeWeight?: number | null;
}

@Injectable()
export class AdjustedPriceService {
  constructor(private readonly priceAdjustmentEventRepository: PriceAdjustmentEventRepository) {}

  async adjustOhlc(symbol: string, rows: OhlcRow[]): Promise<OhlcRow[]> {
    if (!rows.length) return rows;
    const endDate = rows[rows.length - 1].date;
    const events = await this.priceAdjustmentEventRepository.findBySymbolThroughDate(symbol, endDate);
    if (!events.length) return rows;

    return rows.map(row => {
      const factor = events
        .filter(event => row.date < event.effectiveDate)
        .reduce((product, event) => product * event.factor, 1);

      if (factor === 1) return row;
      return {
        ...row,
        openPrice: this.adjustPrice(row.openPrice, factor),
        highPrice: this.adjustPrice(row.highPrice, factor),
        lowPrice: this.adjustPrice(row.lowPrice, factor),
        closePrice: this.adjustPrice(row.closePrice, factor),
      };
    });
  }

  private adjustPrice(value: number | null | undefined, factor: number): number | null | undefined {
    if (value === null || value === undefined) return value;
    return Number((value * factor).toFixed(2));
  }
}
