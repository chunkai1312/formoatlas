/**
 * Migration: remove OTC warrant ticker documents
 *
 * 上櫃權證不應作為熱門個股、成交量值或法人買賣超排行資料。
 * 此 migration 刪除既有已入庫的 OTC equity warrant documents。
 *
 * 執行方式（於 mongosh 中）：
 *   load("remove-otc-warrants.js")
 *
 * 或直接用 mongosh 執行：
 *   mongosh <connection-string> remove-otc-warrants.js
 */

const otcWarrantSymbolPattern = /^7[0-3](?:[0-9]{4}|[0-9]{3}[PFQCBXYU])$/;

const query = {
  type: 'EQUITY',
  market: 'OTC',
  symbol: { $regex: otcWarrantSymbolPattern },
};

const before = db.tickers.countDocuments(query);
print(`OTC warrant ticker documents before delete: ${before}`);

const result = db.tickers.deleteMany(query);
print(`Deleted OTC warrant ticker documents: ${result.deletedCount}`);

const after = db.tickers.countDocuments(query);
print(`OTC warrant ticker documents after delete: ${after}`);
