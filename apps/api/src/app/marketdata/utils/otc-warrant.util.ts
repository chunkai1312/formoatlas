export const OTC_WARRANT_SYMBOL_PATTERN = /^7[0-3](?:[0-9]{4}|[0-9]{3}[PFQCBXYU])$/;

export function isOtcWarrant(symbol: string): boolean {
  return OTC_WARRANT_SYMBOL_PATTERN.test(symbol);
}
