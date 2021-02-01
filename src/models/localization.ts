import { Tier, Cycle, Gender, PaymentMethod, OrderType, Edition } from "./enums";
import { getProperty } from "./index-types";
import { Dictionary } from "./data-types";
import { formatMoney } from "../util/formatter";

export const paymentMethodsCN: Record<PaymentMethod, string> = {
  "wechat": "微信支付",
  "alipay": "支付宝",
  "stripe": "Stripe",
  "apple": "App Store",
  "b2b": "B2B",
};

export const membershipSource: Record<PaymentMethod, string> = {
  'wechat': '',
  'alipay': '',
  'stripe': 'Stripe订阅',
  'apple': 'App Store内购',
  'b2b': '企业订阅'
};

export const orderIntent: Record<OrderType, string> = {
  create: '订阅FT会员',
  renew: '续订FT会员',
  upgrade: '升级高端版',
  downgrade: '转为标准版',
  add_on: '自动续订备用包'
};

export const gendersCN: Record<Gender, string> = {
  M: "男",
  F: "女",
};

export function localizeGender(g: Gender | null): string {
  if (!g) {
    return "";
  }

  return gendersCN[g];
}

export const cyclesCN: Record<Cycle, string> = {
  year: "年",
  month: "月",
};

export function localizeCycle(cycle: Cycle): string {
    return getProperty(cyclesCN, cycle);
}

export const tiersCN: Record<Tier, string> = {
  standard: "标准会员",
  premium: "高端会员",
  vip: "VIP",
};

export function localizeTier(tier: Tier | null): string {
  if (!tier) {
    return "尚未成为会员";
  }
  return getProperty(tiersCN, tier);
}

export function localizeEdition(e: Edition): string {
  return `${localizeTier(e.tier)}/${localizeCycle(e.cycle)}`;
}

export const currencySymbols: Dictionary<string> = {
    "cny": "¥",
    "eur": "€",
    "gbp": "£",
    "hkd": "HK$",
    "jpy": "¥",
    "usd": "US$",
};

export function localizeCurrency(str: string): string {
  return currencySymbols[str] || str;
}

export interface PriceText {
  currency: string;
  amount: number;
  cycle?: Cycle;
}

export function formatPriceText(p: PriceText): string {
  const cycle = p.cycle
    ? `/${localizeCycle(p.cycle)}`
    : '';

  return `${localizeCurrency(p.currency)}${formatMoney(p.amount)}${cycle}`
}
