import request from "superagent";
import {
  Account, collectAccountIDs,
} from "../models/account";
import {
  Plan,
} from "../models/paywall";
import {
  subsApi,
} from "../config/api";
import {
  AliOrder,
  WxOrder,
  IWxQueryResult,
} from "../models/order";
import {
  viper,
} from "../config/viper";
import {
  IHeaderReaderId,
  IHeaderApp,
  IHeaderWxAppId,
} from "../models/header";
import { oauth, noCache } from "../util/request";

class Subscription {
  /**
   * @todo: build this url dynamcially, based on which site the app is run.
   */
  readonly aliReturnUrl: string = "http://next.ftchinese.com/user/subscription/done/ali";

  async aliDesktopPay(plan: Plan, headers: IHeaderReaderId & IHeaderApp, sandbox: boolean): Promise<AliOrder> {

    const resp = await request
      .post(subsApi.aliPayDesktop(plan.tier, plan.cycle, sandbox))
      .use(oauth)
      .use(noCache)
      .query({
        return_url: this.aliReturnUrl,
      })
      .set(headers);

    return resp.body;
  }

  async aliMobilePay(plan: Plan, headers: IHeaderReaderId & IHeaderApp, sandbox: boolean): Promise<AliOrder> {

    const resp = await request
      .post(
        subsApi.aliPayMobile(
          plan.tier,
          plan.cycle,
          sandbox,
        )
      )
      .use(oauth)
      .use(noCache)
      .query({
        return_url: this.aliReturnUrl,
      })
      .set(headers);

    return resp.body;
  }

  async wxDesktopPay(plan: Plan, headers: IHeaderReaderId & IHeaderApp, sandbox: boolean): Promise<WxOrder> {

    const resp = await request
      .post(
        subsApi.wxPayDesktop(
          plan.tier,
          plan.cycle,
          sandbox,
        )
      )
      .use(oauth)
      .use(noCache)
      .set(headers);

    return resp.body;
  }

  async wxOrderQuery(account: Account, orderId: string): Promise<IWxQueryResult> {

    const headers: IHeaderReaderId & IHeaderWxAppId = {
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
