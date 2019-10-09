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
    UIBase,
} from "./ui";
import { 
    IFetchResult, APIError,
} from "./api-response";
import { 
    Banner,
    Product,
} from "../models/paywall";

interface UIMembership {
    tier: string;
    expiration: string;
    renew?: {
        remaining: string;
        link: string;
    };
    ordersLink?: string;
}

interface UIPaywall {
    banner: Banner;
    products: Array<Product>;
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
    
    buildPaywallUI(): UIPaywall {
        return {
            banner: new Banner(),
            products: [
                new Product("standard"),
                new Product("premium"),
            ]
        }
    }
}

export const subViewModel = new SubViewModel();
