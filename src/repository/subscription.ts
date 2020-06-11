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
import { Plan } from "../models/product";

export type PayConfig = {
  idHeaders: HeaderReaderId;
  appHeaders: HeaderApp;
  sandbox: boolean;
}

export type AlipayConfig =  PayConfig & {
  aliCallbackUrl: string;
}

class Subscription {

  async aliDesktopPay(plan: Plan, config: AlipayConfig): Promise<AliOrder> {

    const resp = await request
      .post(subsApi.aliPayDesktop(plan.tier, plan.cycle, config.sandbox))
      .use(oauth)
      .use(noCache)
      .query({
        return_url: config.aliCallbackUrl,
      })
      .set({
        ...config.idHeaders,
        ...config.appHeaders,
      });

    return resp.body;
  }

  async aliMobilePay(plan: Plan, config: AlipayConfig): Promise<AliOrder> {

    const resp = await request
      .post(
        subsApi.aliPayMobile(
          plan.tier,
          plan.cycle,
          config.sandbox,
        )
      )
      .use(oauth)
      .use(noCache)
      .query({
        return_url: config.aliCallbackUrl,
      })
      .set({
        ...config.idHeaders,
        ...config.appHeaders,
      });

    return resp.body;
  }

  async wxDesktopPay(plan: Plan, config: PayConfig): Promise<WxOrder> {

    const resp = await request
      .post(
        subsApi.wxPayDesktop(
          plan.tier,
          plan.cycle,
          config.sandbox,
        )
      )
      .use(oauth)
      .use(noCache)
      .set({
        ...config.idHeaders,
        ...config.appHeaders,
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

export const subRepo = new Subscription();
