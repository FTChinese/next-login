export type LoginMethod = "email" | "wechat";
export type PaymentMethod = "alipay" | "wechat" | "stripe" | "apple" | "b2b";
export type Tier = "standard" | "premium" | "vip";
export type Cycle = "month" | "year";
export type Gender = "M" | "F";
export type Platform = "web" | "ios" | "android"
export type SubStatus = "active" | "canceled" | "incomplete" | "incomplate_expired" | "past_due" | "trialing" | "unpaid";
export type OrderType = "create" | "renew" | "upgrade";
export type AccountKind = "ftc" | "wechat" | "linked";
