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
  HeaderApp,
} from "../models/header";
import { oauth, noCache } from "../util/request";
import { Paywall, Plan } from "../models/paywall";
import { Edition } from '../models/enums';
import { paywallCache } from "./cache";
import { subsMap } from "../config/sitemap";

export type PayConfig =  {
  account: Account;
  appHeaders: HeaderApp;
}

export type AlipayConfig =  PayConfig & {
  originUrl: string;
}

class SubscriptionService {

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

  async pricingPlan(e: Edition, sandbox: boolean): Promise<Plan | undefined> {
    const plan = paywallCache.getPlan(e);
    if (plan) {
      return plan;
    }

    const resp = await request
      .get(subsApi.pricingPlans(sandbox))
      .use(oauth);

    const body: Plan[] = resp.body;

    paywallCache.savePlans(body);

    return body.find(plan => plan.tier == e.tier && plan.cycle == e.cycle);
  }

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

  async verifyPayResult(order: OrderBase, account: Account): Promise<PaymentResult> {
    const sandbox = isTestAccount(account)
    const resp = await request
      .post(subsApi.verifyPayment(order.id, sandbox))
      .use(oauth)
      .use(noCache)

    return resp.body;
  }

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

  // async wxOrderQuery(account: Account, orderId: string): Promise<IWxQueryResult> {

  //   const resp = await request
  //     .get(subsApi.wxQueryOrder(orderId, isTestAccount(account)))
  //     .use(oauth)
  //     .use(noCache)
  //     .set(collectAccountIDs(account));

  //   return resp.body as IWxQueryResult;
  // }
}

export const subsService = new SubscriptionService();
