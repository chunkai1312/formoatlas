export interface MarketStats {
  date: string;

  // 加權指數
  taiexPrice: number;
  taiexChange: number;
  taiexTradeValue: number;

  // 三大法人買賣超（億元）
  finiNetBuySell: number;      // 外資
  sitcNetBuySell: number;      // 投信
  dealersNetBuySell: number;   // 自營商

  // 融資券
  marginBalance: number;
  marginBalanceChange: number;
  marginMaintenanceRatio?: number; // decimal ratio，例如 1.9898 = 198.98%
  shortBalance: number;
  shortBalanceChange: number;

  // 期貨籌碼（口數）
  finiTxfNetOi: number;                          // 外資台指期淨OI
  finiTxoCallsNetOiValue: number;
  finiTxoPutsNetOiValue: number;
  finiTxoNetOiValue: number;                     // 外資選擇權淨OI市值（Call - Put）
  finiTxoNetOiValueChange: number;
  topTenSpecificFrontMonthTxfNetOi: number;      // 大額商近月
  topTenSpecificBackMonthsTxfNetOi: number;      // 大額商遠月
  retailMxfNetOi: number;                        // 散戶小台淨OI
  retailMxfLongShortRatio: number;               // 散戶多空比

  // 情緒指標
  retailTmfNetOi: number;
  retailTmfLongShortRatio: number;
  txoPutCallRatio: number;                       // P/C Ratio
  usdtwd: number;                                // 匯率

  // 市場廣度
  advanceCount?: number;
  limitUpCount?: number;
  declineCount?: number;
  limitDownCount?: number;
  unchangedCount?: number;
}
