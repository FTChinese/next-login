import request from "superagent";
import { 
    Account, 
    IAppHeader 
} from "../models/reader";
import { 
    Plan,
} from "../models/paywall";
import { 
    subsApiBase, subsApi, KEY_APP_ID,
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

class Subscription {
    readonly aliReturnUrl: string = "http://next.ftchinese.com/user/subscription/done/ali";

    async aliDesktopPay(account: Account, plan: Plan, app: IAppHeader): Promise<AliOrder> {
        const url = `${subsApiBase}/alipay/desktop/${plan.tier}/${plan.cycle}`;

        const resp = await request
            .post(url)
            .query({
                return_url: this.aliReturnUrl,
            })
            .set(account.idHeaders)
            .set(app);

        return aliOrderSerializer.parse(resp.text)!;
    }

    async aliMobilePay(account: Account, plan: Plan, app: IAppHeader): Promise<AliOrder> {
        const url = `${subsApiBase}/alipay/mobile/${plan.tier}/${plan.cycle}`;

        const resp = await request
            .post(url)
            .query({
                return_url: this.aliReturnUrl,
            })
            .set(account.idHeaders)
            .set(app);

        return aliOrderSerializer.parse(resp.text)!;
    }

    async wxDesktopPay(account: Account, plan: Plan, app: IAppHeader): Promise<WxOrder> {
        const url = `${subsApiBase}/wxpay/desktop/${plan.tier}/${plan.cycle}`;

        const resp = await request
            .post(url)
            .set(account.idHeaders)
            .set(app);

        return wxOrderSerializer.parse(resp.text)!;
    }

    async wxOrderQuery(accout: Account, orderId: string): Promise<IWxQueryResult> {
        const appId = viper.getConfig().wxapp.web_pay.app_id;

        const resp = await request
            .get(subsApi.wxQueryOrder(orderId))
            .set(KEY_APP_ID, appId)
            .set(accout.idHeaders);

        return resp.body as IWxQueryResult;
    }
}

export const subRepo = new Subscription();
