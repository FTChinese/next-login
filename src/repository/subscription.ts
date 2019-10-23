import request from "superagent";
import { 
    Account, 
} from "../models/reader";
import { 
    Plan,
} from "../models/paywall";
import { 
    subsApi,
} from "../config/api";
import { 
    AliOrder, 
    WxOrder,
    aliOrderSerializer,
    wxOrderSerializer,
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

class Subscription {
    readonly aliReturnUrl: string = "http://next.ftchinese.com/user/subscription/done/ali";

    async aliDesktopPay(plan: Plan, headers: IHeaderReaderId & IHeaderApp, sandbox: boolean): Promise<AliOrder> {

        const resp = await request
            .post(subsApi.aliPayDesktop(plan.tier, plan.cycle, sandbox))
            .query({
                return_url: this.aliReturnUrl,
            })
            .set(headers);

        return aliOrderSerializer.parse(resp.text)!;
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
            .query({
                return_url: this.aliReturnUrl,
            })
            .set(headers);

        return aliOrderSerializer.parse(resp.text)!;
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
            .set(headers);

        return wxOrderSerializer.parse(resp.text)!;
    }

    async wxOrderQuery(account: Account, orderId: string): Promise<IWxQueryResult> {

        const headers: IHeaderReaderId & IHeaderWxAppId = {
            ...(account.idHeaders),
            "X-App-Id": viper.getConfig().wxapp.web_pay.app_id
        }

        const resp = await request
            .get(subsApi.wxQueryOrder(orderId))
            .set(headers);

        return resp.body as IWxQueryResult;
    }
}

export const subRepo = new Subscription();
