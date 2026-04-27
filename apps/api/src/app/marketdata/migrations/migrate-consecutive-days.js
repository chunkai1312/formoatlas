/**
 * Migration: instInvestors consecutiveDays backfill
 *
 * 補算所有 Ticker documents 中 instInvestors.fini.consecutiveDays
 * 與 instInvestors.sitc.consecutiveDays。
 *
 * 計算規則：
 *   net > 0, prev > 0  → prev + 1
 *   net > 0, prev <= 0 → 1
 *   net < 0, prev < 0  → prev - 1
 *   net < 0, prev >= 0 → -1
 *   net = 0            → 0
 *
 * 執行方式（於 mongosh 中）：
 *   load("migrate-consecutive-days.js")
 *
 * 或直接用 mongosh 執行：
 *   mongosh <connection-string> migrate-consecutive-days.js
 */

function calcConsecutiveDays(net, prev) {
  if (net > 0) return prev > 0 ? prev + 1 : 1;
  if (net < 0) return prev < 0 ? prev - 1 : -1;
  return 0;
}

// 取得所有有 instInvestors 的交易日（升冪）
const dates = db.tickers.distinct('date', { instInvestors: { $exists: true } }).sort();

print(`Found ${dates.length} dates to process.`);

// 以 market+symbol 為 key 追蹤前一日 consecutiveDays
const prevFini = {}; // key: `${market}:${symbol}`
const prevSitc = {};

let totalUpdated = 0;

for (const date of dates) {
  const docs = db.tickers.find(
    { date, instInvestors: { $exists: true } },
    { _id: 1, symbol: 1, market: 1, 'instInvestors.fini.net': 1, 'instInvestors.sitc.net': 1 }
  ).toArray();

  const bulkOps = [];

  for (const doc of docs) {
    const key = `${doc.market}:${doc.symbol}`;
    const finiNet = doc.instInvestors?.fini?.net ?? 0;
    const sitcNet = doc.instInvestors?.sitc?.net ?? 0;

    const finiDays = calcConsecutiveDays(finiNet, prevFini[key] ?? 0);
    const sitcDays = calcConsecutiveDays(sitcNet, prevSitc[key] ?? 0);

    prevFini[key] = finiDays;
    prevSitc[key] = sitcDays;

    bulkOps.push({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            'instInvestors.fini.consecutiveDays': finiDays,
            'instInvestors.sitc.consecutiveDays': sitcDays,
          },
        },
      },
    });
  }

  if (bulkOps.length > 0) {
    const result = db.tickers.bulkWrite(bulkOps, { ordered: false });
    totalUpdated += result.modifiedCount;
  }

  print(`Processed date ${date}: ${docs.length} docs.`);
}

print(`Migration complete. Total updated: ${totalUpdated}`);
