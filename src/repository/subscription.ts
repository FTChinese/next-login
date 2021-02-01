import request from "superagent";
import {
  Account, collectAccountIDs, isTestAccount,
} from "../models/account";
import {
  subsApi,
} from "./api";
import {
  AliOrder,
  WxOrder,
  PaymentResult,
  OrderBase,
} from "../models/order";
import {
  HeaderApp, KEY_USER_ID,
} from "../models/header";
import { oauth, noCache } from "../util/request";
import { Paywall, Plan } from "../models/paywall";
import { Edition } from '../models/enums';
import { paywallCache } from "./cache";
import { subsMap } from "../config/sitemap";
import { CheckoutJWTPayload, CheckoutSession, newCheckoutReq, Price, StripeEdition } from "../models/stripe";

export type PayConfig =  {
  account: Account;
  appHeaders: HeaderApp;
}

export type AlipayConfig =  PayConfig & {
  originUrl: string;
}

class SubscriptionService {

  /**
   * @description Fetch ftc paywall data
   * @param sandbox 
   */
  async paywall(sandbox: boolean): Promise<Paywall> {
    const value = paywallCache.getPaywall();
    
    if (value) {
      return value;
    }

    const resp = await request
      .get(subsApi.paywall(sandbox))
      .use(oauth);

    const body:  Paywall = resp.body;

    paywallCache.savePaywall(body);

    return body;
  }

  /**
   * @description Fetch a ftc plan.
   * @param e 
   * @param sandbox 
   */
  async getFtcPlan(e: Edition, sandbox: boolean): Promise<Plan | undefined> {
    const plan = paywallCache.getFtcPlan(e);
    if (plan) {
      return plan;
    }

    const resp = await request
      .get(subsApi.ftcPlans(sandbox))
      .use(oauth);

    const body: Plan[] = resp.body;

    paywallCache.saveFtcPlans(body);

    return body.find(plan => plan.tier == e.tier && plan.cycle == e.cycle);
  }

  /**
   * @description Create order for alipay in desktop browser.
   * @param plan 
   * @param config 
   */
  async aliDesktopPay(plan: Plan, config: AlipayConfig): Promise<AliOrder> {

    const sandbox = isTestAccount(config.account);
    
    const resp = await request
      .post(subsApi.aliPayDesktop(sandbox))
      .use(oauth)
      .use(noCache)
      .query({
        test: sandbox,
      })
      .set({
        ...collectAccountIDs(config.account),
        ...config.appHeaders,
      })
      .send({
        tier: plan.tier,
        cycle: plan.cycle,
        planId: plan.id,
        returnUrl: subsMap.aliReturnUrl(config.originUrl),
      });

    return resp.body;
  }

  // Create order for alipay on mobile browser
  async aliMobilePay(plan: Plan, config: AlipayConfig): Promise<AliOrder> {

    const sandbox = isTestAccount(config.account);

    const resp = await request
      .post(subsApi.aliPayMobile(sandbox))
      .use(oauth)
      .use(noCache)
      .query({
        test: sandbox,
      })
      .set({
        ...collectAccountIDs(config.account),
        ...config.appHeaders,
      })
      .send({
        tier: plan.tier,
        cycle: plan.cycle,
        planId: plan.id,
        returnUrl: subsMap.aliReturnUrl(config.originUrl),
      });

    return resp.body;
  }

  /**
   * Create order for wechat pay on desktop.
   * Payment in mobile browsers cannot be performed
   * in this app since Wechat verifies the origin's IP.
   * @param plan 
   * @param config 
   */
  async wxDesktopPay(plan: Plan, config: {appHeaders: HeaderApp, account: Account}): Promise<WxOrder> {

    const sandbox = isTestAccount(config.account);

    const resp = await request
      .post(subsApi.wxPayDesktop(sandbox))
      .use(oauth)
      .use(noCache)
      .query({
        test: sandbox,
      })
      .set({
        ...collectAccountIDs(config.account),
        ...config.appHeaders,
      })
      .send({
        tier: plan.tier,
        cycle: plan.cycle,
        planId: plan.id,
      });

    return resp.body;
  }

  /**
   * @description Verify an order to get payment result
   * @param order 
   * @param account 
   */
  async verifyPayResult(order: OrderBase, account: Account): Promise<PaymentResult> {
    const sandbox = isTestAccount(account)
    const resp = await request
      .post(subsApi.verifyPayment(order.id, sandbox))
      .use(oauth)
      .use(noCache)

    return resp.body;
  }

  /**
   * @description Fetch a list of stripe prices.
   * @param account - Used to distinguish live or test mode.
   */
  async getStripePrice(e: Edition, sandbox: boolean): Promise<Price | undefined> {
    const se: StripeEdition = {
      tier: e.tier,
      cycle: e.cycle,
      live: !sandbox
    }

    const price = paywallCache.getStripePrice(se);

    if (price) {
      return price;
    }

    const resp = await request
      .get(subsApi.stripePriceList(sandbox))
      .use(oauth);

    const prices: Price[] = resp.body;
    paywallCache.saveStripePrices(prices);

    return paywallCache.getStripePrice(se)
  }

  /**
   * @description Create a stripe checkout session.
   * @param body 
   * @param account 
   */
  async stripeCheckoutSession(payload: CheckoutJWTPayload, origin: string): Promise<CheckoutSession> {

    const resp = await request
      .post(subsApi.stripeCheckout(payload.test))
      .use(oauth)
      .use(noCache)
      .set({
        [KEY_USER_ID]: payload.uid,
      })
      .send(newCheckoutReq(origin, payload));

    return resp.body;
  }
}

export const subsService = new SubscriptionService();
