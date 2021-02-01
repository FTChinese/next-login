import { subsMap } from "../config/sitemap";
import { viper } from "../config/viper";
import { sign } from "../util/jwt";
import { Account, isTestAccount } from "./account";
import { Edition, OrderType } from "./enums";
import { formatPriceText, localizeEdition, orderIntent } from "./localization";
import { Cart } from "./paywall";

export type StripeEdition = Edition & {
  live: boolean;
};

export type Price = StripeEdition & {
  id: string;
  active: boolean;
  currency: string;
  nickname: string | null;
  productId: string;
  unitAmount: number;
  created: number;
}

export function buildStripeCart(kind: OrderType, price: Price): Cart {
  const priceStr = formatPriceText({
    currency: price.currency,
      amount: price.unitAmount / 100
  });

  return {
    header: orderIntent[kind],
    planName: localizeEdition(price),
    price: priceStr,
    payable: priceStr
  }
}

export interface CheckoutSession {
  cancelUrl: string;
  amountTotal: number;
  currency: string;
  customerId: string;
  id: string;
  liveMode: boolean;
  mode: 'payment' | 'setup' | 'subscription',
  paymentStatus: 'no_payment_required' | 'paid' | 'unpaid';
  successUrl: string;
}

export type CheckoutJWTPayload = {
  uid: string;
  test: boolean;
} & Edition;

export function newCheckoutJWTPayload(a: Account, e: Edition): Promise<string | undefined> {
  const payload: CheckoutJWTPayload  = {
    uid: a.id,
    test: isTestAccount(a),
    tier: e.tier,
    cycle: e.cycle,
  };

  return sign(
    payload,
    viper.sessionKey,
    {
      algorithm: 'HS256',
      expiresIn: 5 * 60,
    }
  );
}

export type CheckoutReq = {
  successUrl: string;
  cancelUrl: string;
} & Edition;

export function newCheckoutReq(origin: string, e: Edition): CheckoutReq {
  return {
    successUrl: `${origin}/${subsMap.stripeDone}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/${subsMap.stripeDone}/cancel`,
    tier: e.tier,
    cycle: e.cycle,
  }
}
