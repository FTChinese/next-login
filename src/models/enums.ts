import { cy } from "date-fns/locale";

export type LoginMethod = "email" | "wechat";
export type PaymentMethod = "alipay" | "wechat" | "stripe" | "apple" | "b2b";
export type Tier = "standard" | "premium" | "vip";
export type Cycle = "month" | "year";
export type Gender = "M" | "F";
export type Platform = "web" | "ios" | "android"
export type SubStatus = "active" | "canceled" | "incomplete" | "incomplate_expired" | "past_due" | "trialing" | "unpaid";
export type OrderType = "create" | "renew" | "upgrade" | 'downgrade';
export type AccountKind = "ftc" | "wechat" | "linked";

export const tiers: Tier[] = ['standard', 'premium'];
export const cycles: Cycle[] = ['month', 'year'];

export interface Edition {
  tier: Tier;
  cycle: Cycle;
}

export function validateEdition(tier: Tier, cycle: Cycle): boolean {
  if (!tiers.includes(tier)) {
    return false;
  }

  if (!cycles.includes(cycle)) {
    return false;
  }

  if (tier === 'premium' && cycle === 'month') {
    return false;
  }

  return true;
}
