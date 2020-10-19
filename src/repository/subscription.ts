import request from "superagent";
import {
  Account, collectAccountIDs,
} from "../models/account";
import {
  subsApi,
} from "./api";
import {
  AliOrder,
  WxOrder,
  IWxQueryResult,
} from "../models/order";
import {
  viper,
} from "../config/viper";
import {
  HeaderReaderId,
  HeaderApp,
  HeaderWxAppId,
} from "../models/header";
import { oauth, noCache } from "../util/request";
import { Paywall, Plan } from "../models/paywall";
import { paywallCache } from "./cache";
import { Tier, Cycle } from "../models/enums";
import { subsMap } from "../config/sitemap";

export type PayConfig = {
  idHeaders: HeaderReaderId;
  appHeaders: HeaderApp;
  sandbox: boolean;
}

export type AlipayConfig =  PayConfig & {
  originUrl: string;
}

class SubscriptionService {

  async paywall(): Promise<Paywall> {
    const value = paywallCache.getPaywall();
    
    if (value) {
      return value;
    }

    const resp = await request
      .get(subsApi.paywall)
      .use(oauth);

    const body:  Paywall = resp.body;

    paywallCache.savePaywall(body);

    return body;
  }

  async pricingPlan(tier: Tier, cycle: Cycle): Promise<Plan | undefined> {
    const plan = paywallCache.getPlan(tier, cycle);
    if (plan) {
      return plan;
    }

    const resp = await request
      .get(subsApi.pricingPlans)
      .use(oauth);

    const body: Plan[] = resp.body;

    paywallCache.savePlans(body);

    return body.find(plan => plan.tier == tier && plan.cycle == cycle);
  }

  async aliDesktopPay(plan: Plan, config: AlipayConfig): Promise<AliOrder> {

    const resp = await request
      .post(subsApi.aliPayDesktop)
      .use(oauth)
      .use(noCache)
      .query({
        test: config.sandbox,
      })
      .set({
        ...config.idHeaders,
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

  async aliMobilePay(plan: Plan, config: AlipayConfig): Promise<AliOrder> {

    const resp = await request
      .post(subsApi.aliPayMobile)
      .use(oauth)
      .use(noCache)
      .query({
        test: config.sandbox,
      })
      .set({
        ...config.idHeaders,
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

  async wxDesktopPay(plan: Plan, config: PayConfig): Promise<WxOrder> {

    const resp = await request
      .post(subsApi.wxPayDesktop)
      .use(oauth)
      .use(noCache)
      .set({
        ...config.idHeaders,
        ...config.appHeaders,
      })
      .send({
        tier: plan.tier,
        cycle: plan.cycle,
        planId: plan.id,
      });

    return resp.body;
  }

  async wxOrderQuery(account: Account, orderId: string): Promise<IWxQueryResult> {

    const headers: HeaderReaderId & HeaderWxAppId = {
      ...(collectAccountIDs(account)),
      "X-App-Id": viper.getConfig().wxapp.web_pay.app_id
    }

    const resp = await request
      .get(subsApi.wxQueryOrder(orderId))
      .use(oauth)
      .use(noCache)
      .set(headers);

    return resp.body as IWxQueryResult;
  }
}

export const subsService = new SubscriptionService();
