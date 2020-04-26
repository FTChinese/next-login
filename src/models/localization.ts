import { Tier, Cycle, Gender, PaymentMethod } from "./enums";
import { getProperty } from "./index-types";
import { Dictionary } from "./data-types";

const paymentMethods: Record<PaymentMethod, string> = {
    "wechat": "微信支付",
    "alipay": "支付宝",
    "stripe": "Stripe",
    "apple": "App Store",
    "b2b": "B2B",
};

export function localizePayMethod(pm: PaymentMethod): string {
    return getProperty(paymentMethods, pm);
}

const genders = {
    "M": "男",
    "F": "女",
};

export function localizeGender(gender: Gender): string {
    return getProperty(genders, gender);
}

const intervals = {
    "year": "年",
    "month": "月",
};

export function localizeCycle(cycle: Cycle): string {
    return getProperty(intervals, cycle);
}

const tiers = {
    "standard": "标准会员",
    "premium": "高端会员",
};

export function localizeTier(tier: Tier): string {
    return getProperty(tiers, tier);
}

export const currencySymbols: Dictionary<string> = {
    "cny": "¥",
    "eur": "€",
    "gbp": "£",
    "hkd": "HK$",
    "jpy": "¥",
    "usd": "US$",
};
