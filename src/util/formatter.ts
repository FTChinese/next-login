import { DateTime } from "luxon";
import numeral from "numeral";

export function iso8601ToCST(str: string, { withZone = true } = {}): string {
  const fmt = withZone 
    ? "yyyy-LL-dd HH:mm:ss (ZZ z)" 
    : "yyyy-LL-dd HH:mm:ss";

  try {
    return DateTime.fromISO(str)
      .setZone("Asia/Shanghai")
      .toFormat(fmt);
  } catch (e) {
    return str;
  }
}

export function formatMoney(num: number): string {
  return numeral(num).format("0,0.00");
}

export function formatMoneyInCent(cent: number): string {
  return formatMoney(cent / 100);
}
