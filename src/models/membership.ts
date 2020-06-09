import { Tier, Cycle, PaymentMethod, SubStatus } from "./enums";
import { DateTime } from "luxon";

export interface Membership {
  id: string | null;
  tier: Tier | null;
  cycle: Cycle | null;
  expireDate: string | null;
  payMethod: PaymentMethod | null;
  autoRenew: boolean;
  status: SubStatus | null;
  vip: boolean;
}

export function isMember(m: Membership): boolean {
  return (!!m.tier) && (!!m.cycle) && (!!m.expireDate);
}

export function isMemberExpired(m: Membership): boolean {
  if (!m.expireDate) {
    return true;
  }

  const expireOn = DateTime.fromISO(m.expireDate);
  const today = DateTime.local().startOf("day");

  return expireOn < today;
}
