import { formatMoney } from "../util/formatter";
import { Tier, Cycle } from "./enums";
import { localizeCurrency, localizeCycle, localizeTier } from "./localization";
import { DateTime } from "luxon";
import { subsMap } from "../config/sitemap";

export function subsPlanName(tier: Tier, cycle: Cycle): string {
  return `${localizeTier(tier)}/${localizeCycle(cycle)}`;
}

export function paymentUrl(tier: Tier, cycle: Cycle): string {
  return `${subsMap.pay}/${tier}/${cycle}`;
}

interface Discount {
  id: string | null; // null indicates no discount.
  priceOff: number;
  startUtc: string | null;
  endUtc: string | null;
}

export function isDiscountValid(d: Discount): boolean {
  if (!d.id) {
    return false;
  }

  if (!d.startUtc || !d.endUtc) {
    return false;
  }

  if (d.priceOff == 0) {
    return false;
  }

  const startOn = DateTime.fromISO(d.startUtc);
  const endOn = DateTime.fromISO(d.endUtc);

  const today = DateTime.utc();

  return today >= startOn && today <= endOn;
}

export interface Plan {
  id: string;
  price: number;
  currency: string
  tier: Tier;
  cycle: Cycle;
  discount: Discount;
}

export function dailyPrice(p: Plan): string {
  if (p.cycle == "month") {
    return formatMoney(p.price / 30);
  }

  return formatMoney(p.price / 365);
}

export function listPrice(p: Plan): string {
  return `${localizeCurrency(p.currency)} ${formatMoney(p.price)}`;
}

export function netPrice(p: Plan): string | null {

  if (!isDiscountValid(p.discount)) {
    return null;
  }

  return `${localizeCurrency(p.currency)} ${formatMoney(p.price - p.discount.priceOff)}`;
}

const planStdYear: Plan = {
  id: "standard_year",
  price: 258,
  currency: "cny",
  tier: "standard",
  cycle: "year",
  discount: {
    id: null,
    priceOff: 0,
    startUtc: null,
    endUtc: null,
  },
}

const planStdMonth: Plan = {
  id: "standard_month",
  price: 28,
  currency: "cny",
  tier: "standard",
  cycle: "month",
  discount: {
    id: null,
    priceOff: 0,
    startUtc: null,
    endUtc: null,
  },
}

const planPrmYear: Plan = {
  id: "premium_year",
  price: 1998,
  currency: "cny",
  tier: "premium",
  cycle: "year",
  discount: {
    id: null,
    priceOff: 0,
    startUtc: null,
    endUtc: null,
  },
}

const plans: Map<string, Plan> = new Map([
  [planStdYear.id, planStdYear],
  [planStdMonth.id, planStdMonth],
  [planPrmYear.id, planPrmYear],
]);

export function findPlan(tier: Tier, cycle: Cycle): Plan | null {
    const key = `${tier}_${cycle}`;

    return plans.get(key) || null;
}

export interface Product {
  id: string;
  tier: Tier;
  heading: string;
  description: string[];
  smallPrint: string | null;
  plans: Plan[];
}

export const productStd: Product = {
  id: "standard_product",
  tier: "standard",
  heading: "标准会员",
  description: [
    `专享订阅内容每日仅需${dailyPrice(planStdYear)}元(或按月订阅每日${dailyPrice(planStdMonth)}元)`,
    "精选深度分析",
    "中英双语内容",
    "金融英语速读训练",
    "英语原声电台",
    "无限浏览7日前所有历史文章（近8万篇）"
  ],
  smallPrint: null,
  plans: [
    planStdYear,
    planStdMonth,
  ],
}

export const productPrm: Product = {
  id: "premium_product",
  tier: "premium",
  heading: "高端会员",
  description: [
    `专享订阅内容每日仅需${dailyPrice(planPrmYear)}元`,
    "享受“标准会员”所有权益",
    "编辑精选，总编/各版块主编每周五为您推荐本周必读资讯，分享他们的思考与观点",
    "FT中文网2018年度论坛门票2张，价值3999元/张 （不含差旅与食宿）"
  ],
  smallPrint: "注：所有活动门票不可折算现金、不能转让、不含差旅与食宿",
  plans: [
    planPrmYear,
  ],
}

export interface Paywall {
  banner: {
    heading: string;
    subHeading: string;
    coverUrl: string;
    content: string[];
  };
  products: Product[];
}

export const paywall: Paywall = {
  banner: {
    heading: "FT中文网会员订阅服务",
    subHeading: "欢迎您",
    coverUrl: "http://www.ftacademy.cn/subscription.jpg",
    content: [
      "希望全球视野的FT中文网，能够带您站在高海拔的地方俯瞰世界，引发您的思考，从不同的角度看到不一样的事物，见他人之未见！"
    ]
  },
  products: [
    productStd,
    productPrm
  ],
};

