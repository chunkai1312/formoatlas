import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MarketStatsDocument = HydratedDocument<MarketStats>;

@Schema({ timestamps: true })
export class MarketStats {

  /**
   * 日期 (YYYY-MM-DD)
   */
  @Prop({ required: true })
  date: string;

  /**
   * 集中市場加權指數收盤價
   */
  @Prop()
  taiexPrice: number;

  /**
   * 集中市場加權指數漲跌點數
   */
  @Prop()
  taiexChange: number;

  /**
   * 集中市場成交金額
   */
  @Prop()
  taiexTradeValue: number;

  /**
   * 集中市場上漲家數
   */
  @Prop()
  advanceCount: number;

  /**
   * 集中市場漲停家數
   */
  @Prop()
  limitUpCount: number;

  /**
   * 集中市場下跌家數
   */
  @Prop()
  declineCount: number;

  /**
   * 集中市場跌停家數
   */
  @Prop()
  limitDownCount: number;

  /**
   * 集中市場平盤家數
   */
  @Prop()
  unchangedCount: number;

  /**
   * 外資買賣超
   */
  @Prop()
  finiNetBuySell: number;

  /**
   * 投信買賣超
   */
  @Prop()
  sitcNetBuySell: number;

  /**
   * 自營商買賣超
   */
  @Prop()
  dealersNetBuySell: number;

  /**
   * 融資餘額
   */
  @Prop()
  marginBalance: number;

  /**
   * 融資餘額變化
   */
  @Prop()
  marginBalanceChange: number;

  /**
   * 融資維持率（decimal ratio，例如 1.9898 = 198.98%）
   */
  @Prop()
  marginMaintenanceRatio?: number;

  /**
   * 融券餘額
   */
  @Prop()
  shortBalance: number;

  /**
   * 融券餘額變化
   */
  @Prop()
  shortBalanceChange: number;

  /**
   * 外資臺股期貨淨未平倉量
   */
  @Prop()
  finiTxfNetOi: number;

  /**
   * 外資臺指選擇權買權淨未平倉金額
   */
  @Prop()
  finiTxoCallsNetOiValue: number;

  /**
   * 外資臺指選擇權賣權淨未平倉金額
   */
  @Prop()
  finiTxoPutsNetOiValue: number;

  /**
   * 大額交易人近月臺股期貨淨未平倉量
   */
  @Prop()
  topTenSpecificFrontMonthTxfNetOi: number;

  /**
   * 大額交易人遠月臺股期貨淨未平倉量
   */
  @Prop()
  topTenSpecificBackMonthsTxfNetOi: number;

  /**
   * 散戶小台淨未平倉量
   */
  @Prop()
  retailMxfNetOi: number;

  /**
   * 散戶小台多空比
   */
  @Prop()
  retailMxfLongShortRatio: number;

  /**
   * 散戶微台淨未平倉量
   */
  @Prop()
  retailTmfNetOi: number;

  /**
   * 散戶微台多空比
   */
  @Prop()
  retailTmfLongShortRatio: number;

  /**
   * 臺指選擇權 PUT/CALL Ratio
   */
  @Prop()
  txoPutCallRatio: number;

  /**
   * 美元兌新台幣匯率
   */
  @Prop()
  usdtwd: number;

  /**
   * AI 晴雨表分析結果（LLM 生成，快取用）
   */
  @Prop({ type: Object })
  aiAnalysis: {
    level: string;
    weather: string;
    label: string;
    summary: string;
  };
}

export const MarketStatsSchema = SchemaFactory.createForClass(MarketStats)
  .index({ date: -1 }, { unique: true });
