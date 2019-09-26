import { 
    DateTime,
} from "luxon";
import numeral from "numeral";

export function iso8601ToCST(str: string): string {
    try {
        return DateTime
            .fromISO(str)
            .setZone("Asia/Shanghai")
            .toFormat("yyyy-LL-dd HH:mm:ss (ZZ z)");
    } catch (e) {
        return str;
    }
}

export function formatMoney(num: number): string {
    return numeral(num).format("0,0.00");
}
