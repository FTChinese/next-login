import MobileDetect from "mobile-detect";
import {
    subsMap,
} from "../config/sitemap";
import {
    Account,
    Membership,
} from "../models/reader";
import {
    accountRepo,
} from "../repository/account";
import {
    UIBase, IListItem, IRadio,
} from "./ui";
import { 
    IFetchResult,
    APIError,
} from "./api-response";
import { 
    Banner,
    Plan,
    IPaywall,
} from "../models/paywall";
import { localizeTier } from "../models/localization";
import { PaymentMethod } from "../models/enums";

interface UIMembership {
    tier: string;
    expiration: string;
    renew?: {
        remaining: string;
        link: string;
    };
    ordersLink?: string;
}

interface UIProduct {
    heading: string;
    benefits: Array<string>;
    smallPrint?: string;
    plans: Array<Plan>
}

interface UIPaywall {
    banner: Banner;
    products: Array<UIProduct>;
}

interface UIQR {
    dataUrl: string;
    doneLink: string;
}

interface UIPayment extends UIBase {
    items: Array<IListItem>;
    sandbox?: boolean;
    radio?: IRadio;
    qr?: UIQR;
}

export interface IPayMethodFormData {
    payMethod: PaymentMethod;
}

interface IFormState {
    value?: PaymentMethod;
    error?: string;
}

interface IPayResult {
    formState?: IFormState;
    errResp?: APIError;
    qrData?: string;
}

class SubViewModel {

    async refresh(account: Account): Promise<IFetchResult<Account>> {
        try {
            switch (account.loginMethod) {
                case "email": {
                    const acnt = await accountRepo.fetchFtcAccount(account.id);

                    return {
                        success: acnt,
                    };
                }
                    
    
                case "wechat": {
                    const acnt = await accountRepo.fetchWxAccount(account.unionId!);

                    return {
                        success: acnt,
                    };
                }
                    
    
                default:
                    return {
                        errResp: new APIError("unknown account type"),
                    };
            }
        } catch (e) {
            return {
                errResp: new APIError(e),
            };
        }
    }

    buildErrorUI(errResp: APIError): UIBase {
        return {
            errors: {
                message: errResp.message,
            },
        };
    }

    buildMemberUI(member: Membership): UIMembership {

        if (member.vip) {
            return {
                tier: "VIP",
                expiration: "无限期"
            };
        }

        const remainingDays = member.remainingDays;

        let remaining = "";
        if (!remainingDays) {
            remaining = ""
        } else if (remainingDays < 0) {
            remaining = "会员已经过期，请续订";
        } else if (remainingDays > 0 && remainingDays <= 7) {
            remaining = `会员即将过期，剩余${remainingDays}天，请续订`;
        } else {
            remaining = "";
        }

        return {
            tier: member.tierCN,
            expiration: member.expireDate || "",
            renew: {
                remaining,
                link: subsMap.renewal,
            },
            ordersLink: subsMap.orders,
        };
    }
    
    buildPaywallUI(data: IPaywall): UIPaywall {
        return {
            banner: new Banner(),
            products: [
                {
                    heading: "标准会员",
                    benefits: [
                        `专享订阅内容每日仅需${data.plans.standard_year.dailyPrice}元(或按月订阅每日${data.plans.standard_month.dailyPrice}元)`,
                        "精选深度分析",
                        "中英双语内容",
                        "金融英语速读训练",
                        "英语原声电台",
                        "无限浏览7日前所有历史文章（近8万篇）"
                    ],
                    plans: [
                        data.plans.standard_year,
                        data.plans.standard_month,
                    ]
                },
                {
                    heading: "高端会员",
                    benefits: [
                        `专享订阅内容每日仅需${data.plans.premium_year.dailyPrice}元`,
                        "享受“标准会员”所有权益",
                        "编辑精选，总编/各版块主编每周五为您推荐本周必读资讯，分享他们的思考与观点",
                        "FT中文网2018年度论坛门票2张，价值3999元/张 （不含差旅与食宿）"
                    ],
                    plans: [
                        data.plans.premium_year,
                    ]
                },
            ],
        };
    }

    validatePayMethod(payMethod?: PaymentMethod): IFormState {
        if (!payMethod) {
            return {
                error: "请选择支付方式",
            };
        }

        if (payMethod != "alipay" && payMethod != "wechat") {
            return {
                error: "请从支付宝或微信支付中选择一种支付方式",
            };
        }

        return {
            value: payMethod,
        };
    }

    buildPaymentUI(plan: Plan, sandbox?: boolean, result?: IPayResult): UIPayment {
        const { formState, errResp } = result || {};
        const uiData: UIPayment = {
            errors: errResp ? {
                message: errResp.message,
            } : undefined,
            items: [
                {
                    label: "会员类型:",
                    value: localizeTier(plan.tier),
                },
                {
                    label: "支付金额:",
                    value: plan.amountText,
                },
            ],
            
        };

        if (result && result.qrData) {
            uiData.qr = {
                dataUrl: result.qrData,
                doneLink: subsMap.wxpayDone,
            };

            return uiData;
        }

        uiData.sandbox = sandbox;
        uiData.radio = {
            name: "payMethod",
            inputs: [
                {
                    label: "支付宝",
                    imageUrl: "http://www.ftacademy.cn/images/alipay-68x24.png",
                    gap: 3,
                    id: "alipay",
                    value: "alipay",
                    checked: formState 
                        ? formState.value == "alipay" 
                        : false,
                },
                {
                    label: "微信支付",
                    imageUrl: "http://www.ftacademy.cn/images/wxpay-113x24.png",
                    gap: 3,
                    id: "wechat",
                    value: "wechat",
                    checked: formState
                        ? formState.value == "wechat"
                        : false,
                },
            ],
            required: true,
            error: formState ? formState.error : undefined,
        };

        return uiData;
    }

    isMobile(ua: string): boolean {
        const md = new MobileDetect(ua);

        return !!md.mobile();
    }
}

export const subViewModel = new SubViewModel();
