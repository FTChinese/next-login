import { func } from "@hapi/joi";
import { DateTime } from "luxon";
import { subsMap } from "../config/sitemap";
import { formatMoney } from "../util/formatter";
import { Cycle, Tier } from "./enums";
import { localizeCurrency, localizeCycle, localizeTier } from "./localization";

export interface Banner {
  id: number;
  heading: string;
  subHeading: string | null;
  coverUrl: string | null;
  content: string | null;
}

export interface Period {
  startUtc?: string;
  endUtc?: string;
}

function isInPeriod(p: Period): boolean {
  if (!p.startUtc || !p.endUtc) {
    return false;
  }

  const startOn = DateTime.fromISO(p.startUtc)
  const endOn = DateTime.fromISO(p.endUtc)

  const today = DateTime.local();

  return today >= startOn && today <= endOn;
}

export type Promo = {
  id: string | null;
  heading: string | null;
  subHeading: string | null;
  coverUrl: string | null;
  content: string | null;
  terms: string | null;
} &  Period;

function isPromoValid(p: Promo): boolean {
  return isInPeriod(p);
}

export type Discount = {
  id: string | null;
  priceOff: number | null;
} & Period & {
  description: string | null;
};

export function isDiscountValid(d: Discount): boolean {
  if (!d.priceOff) {
    return false;
  }

  if (d.priceOff == 0) {
    return false
  }

  return isInPeriod(d);
}

export interface Plan {
  id: string;
  productId: string;
  price: number;
  tier: Tier;
  cycle: Cycle;
  description: string | null;
  discount: Discount;
}

export function dailyCost(p: Plan): string {
  switch (p.cycle) {
    case 'year':
      return formatMoney(p.price / 365)

    case 'month':
      return formatMoney(p.price / 30)
  }
}

/**
 * @description The price button for a plan.
 */
interface PriceLink {
  href?: string;
  highlight: boolean;
  original: string;
  discounted?: string;
}

interface PriceText {
  currency: string;
  amount: number;
  cycle?: Cycle;
}

function formatPriceText(p: PriceText): string {
  const cycle = p.cycle
    ? `/${localizeCycle(p.cycle)}`
    : '';

  return `${localizeCurrency(p.currency)} ${formatMoney(p.amount)}${cycle}`
}

function newPriceLink(plan: Plan, forMember: boolean): PriceLink {

  return {
    href: forMember 
      ? undefined
      : subsMap.checkoutUrl(plan.tier, plan.cycle),
    highlight: plan.cycle === 'year',
    original: formatPriceText({
      currency: 'cny',
      amount: plan.price,
      cycle: plan.cycle,
    }),
    discounted: isDiscountValid(plan.discount) 
      ? formatPriceText({
        currency: 'cny',
        amount: plan.price - (plan.discount.priceOff || 0),
        cycle: plan.cycle,
      })
      : undefined,
  };
}

export interface Cart {
  header: string;
  planName: string;
  price: string;
  priceOff?: string;
  payable: string;
}

export function planName(tier: Tier, cycle: Cycle): string {
  return `${localizeTier(tier)}/${localizeCycle(cycle)}`;
}

export function cartHeader(forMember: boolean): string {
  return forMember ? '续订FT会员' : '订阅FT会员';
}

export function newCart(plan: Plan, forMember: boolean): Cart {
  const hasDiscount = isDiscountValid(plan.discount);

  return {
    header: cartHeader(forMember),
    planName: planName(plan.tier, plan.cycle),
    price: formatPriceText({
      currency: 'cny',
      amount: plan.price,
    }),
    priceOff: hasDiscount
      ? '优惠减 ' + formatPriceText({
        currency: 'cny',
        amount: plan.discount.priceOff || 0,
      })
      : undefined,
    payable: formatPriceText({
      currency: 'cny',
      amount: hasDiscount 
        ? plan.price - (plan.discount.priceOff || 0) 
        : plan.price
    }),
  }
}

export interface Product {
  id: string;
  tier: Tier;
  heading: string;
  description: string | null;
  smallPrint: string | null;
  plans: Plan[];
}

interface ProductCard {
  heading: string;
  description: string | null;
  smallPrint: string | null;
  prices: PriceLink[];
}

function newProductCard(product: Product, forMember: boolean): ProductCard {

  return {
    heading: product.heading,
    description: product.description,
    smallPrint: product.smallPrint,
    prices: product.plans.map(plan => {
      return newPriceLink(plan, forMember)
    })
  };
}

export interface Paywall {
  banner: Banner;
  promo: Promo;
  products: Product[];
}

export interface PaywallUI {
  promo?: Promo;
  products: ProductCard[]
}

export function newPaywallUI(pw: Paywall, forMember: boolean): PaywallUI {
  return {
    promo: isPromoValid(pw.promo) ? pw.promo : undefined,
    products: pw.products.map(prod => {
      return newProductCard(prod, forMember)
    }),
  }
}
