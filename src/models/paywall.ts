import { DateTime } from "luxon";
import { subsMap } from "../config/sitemap";
import { formatMoney } from "../util/formatter";
import { Cycle, Edition, OrderType, Tier } from "./enums";
import { localizeCurrency, localizeCycle, localizeTier, orderIntent } from "./localization";

export interface Wallet {
  balance: number;
  cratedAt: string;
}

export interface UpgradeIntent {
  amount: number;
  currency: string;
  cycleCount: number;
  extraDays: number;
  wallet: Wallet;
}

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

export type Plan = {
  id: string;
  productId: string;
  price: number;
  description: string | null;
  discount: Discount;
} & Edition;

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

  return `${localizeCurrency(p.currency)}${formatMoney(p.amount)}${cycle}`
}

export interface Cart {
  header: string;
  planName: string;
  price: string;
  priceOff?: string;
  balance?: string;
  payable: string;
}

export class PlanParser {
  readonly isDiscountValid: boolean;

  constructor(
    readonly plan: Plan
  ) {
    if (!plan.discount.priceOff) {
      this.isDiscountValid = false;
    } else {
      this.isDiscountValid = isInPeriod(plan.discount);
    }
  }

  dailyCost(): string {
    switch (this.plan.cycle) {
      case 'year':
        return formatMoney(this.plan.price / 365);
  
      case 'month':
        return formatMoney(this.plan.price / 30);
    }
  }

  get priceLink(): PriceLink {

    return {
      href: subsMap.checkoutUrl(this.plan.tier, this.plan.cycle),
      highlight: this.plan.cycle === 'year',
      original: formatPriceText({
        currency: 'cny',
        amount: this.plan.price,
        cycle: this.plan.cycle,
      }),
      discounted: this.isDiscountValid 
        ? formatPriceText({
            currency: 'cny',
            amount: this.plan.price - (this.plan.discount.priceOff || 0),
            cycle: this.plan.cycle,
          })
        : undefined,
    };
  }

  private get originalPrice(): string {
    return formatPriceText({
      currency: 'cny',
      amount: this.plan.price,
    });
  }

  private get offPrice(): string | undefined {
    return this.isDiscountValid
      ? '优惠 - ' + formatPriceText({
        currency: 'cny',
        amount: this.plan.discount.priceOff || 0,
      })
      : undefined
  }

  calculatePayable(balance: number): number {
    const price = this.isDiscountValid
      ? this.plan.price - (this.plan.discount.priceOff || 0) 
      : this.plan.price;

    if (balance > price) {
      return 0;
    }

    return price - balance;
  }

  /**
   * 
   * @param kind - Which kind of order this user is creating: create | renew | upgrade.
   * @param wallet - Used to calculate current balance. It only exists for ali or wx pay upgrading.
   */
  buildCart(kind: OrderType, wallet?: Wallet): Cart {
    return {
      header: orderIntent[kind],
      planName: planName(this.plan.tier, this.plan.cycle),
      price: this.originalPrice,
      priceOff: this.offPrice,
      balance: wallet 
        ? '余额 ' + formatPriceText({
          currency: 'cny',
          amount: wallet.balance
        }) 
        : undefined,
      payable: formatPriceText({
        currency: 'cny',
        amount: this.calculatePayable(wallet?.balance || 0),
      }),
    };
  }
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

function newProductCard(product: Product): ProductCard {

  return {
    heading: product.heading,
    description: product.description,
    smallPrint: product.smallPrint,
    prices: product.plans.map(plan => {
      return (new PlanParser(plan)).priceLink;
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

export function newPaywallUI(pw: Paywall): PaywallUI {
  return {
    promo: isPromoValid(pw.promo) ? pw.promo : undefined,
    products: pw.products.map(prod => {
      return newProductCard(prod)
    }),
  }
}
