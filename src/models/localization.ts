export const paymentMethods = {
    "wechat": "微信支付",
    "alipay": "支付宝",
    "stripe": "Stripe",
};

export const genders = {
    "M": "男",
    "F": "女",
};

export const intervals = {
    "year": "年",
    "month": "月",
};

export const memberTypes = {
    "standard": "标准会员",
    "premium": "高端会员",
    "zeroMember": "尚未成为会员",
};

export const currencySymbols = new Map<string, string>([
    ["cny", "¥"],
    ["eur", "€"],
    ["gbp", "£"],
    ["hkd", "HK$"],
    ["jpy", "¥"],
    ["usd", "US$"],
]);
