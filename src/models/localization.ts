export const memberInfo = new Map<string, string>([
    ["year", "年"],
    ["month", "月"],
    ["standard", "标准会员"],
    ["premium", "高端会员"],
    ["zeroMember", "尚未成为会员"],
]);

export const paymentMethods = new Map<string, string>([
    ["wechat", "微信支付"],
    ["alipay", "支付宝"],
    ["stripe", "Stripe"],
]);

export const genders = new Map<string, string>([
    ["M", "男"],
    ["F", "女"],
]);

export const memberTypes = {
    "standard": "标准会员",
    "premium": "高端会员",
    "zeroMember": "尚未成为会员",
};
