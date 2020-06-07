import { Tier, Cycle, Gender, PaymentMethod } from "./enums";
import { getProperty } from "./index-types";
import { Dictionary } from "./data-types";

export const paymentMethodsCN: Record<PaymentMethod, string> = {
    "wechat": "微信支付",
    "alipay": "支付宝",
    "stripe": "Stripe",
    "apple": "App Store",
    "b2b": "B2B",
};

export function localizePayMethod(pm: PaymentMethod): string {
    return getProperty(paymentMethodsCN, pm);
}

export const gendersCN: Record<Gender, string> = {
  M: "男",
  F: "女",
};

export function localizeGender(gender: Gender): string {
    return getProperty(gendersCN, gender);
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

export function localizeTier(tier: Tier): string {
    return getProperty(tiersCN, tier);
}

export const currencySymbols: Dictionary<string> = {
    "cny": "¥",
    "eur": "€",
    "gbp": "£",
    "hkd": "HK$",
    "jpy": "¥",
    "usd": "US$",
};
