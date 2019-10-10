import request from "superagent";
import { 
    Account, 
    IAppHeader 
} from "../models/reader";
import { 
    Plan,
} from "../models/paywall";
import { 
    subsApiBase,
} from "../config/api";
import { 
    AliOrder, 
    WxOrder,
    aliOrderSerializer,
    wxOrderSerializer,
} from "../models/order";

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
}

export const subRepo = new Subscription();
