import { isProduction, viper } from "./viper";
import { Tier } from "../models/enums";
import { Cycle } from "../models/enums";

export const KEY_USER_ID = "X-User-Id";
export const KEY_UNION_ID = "X-Union-Id";
export const KEY_APP_ID = "X-App-Id";

class ReaderAPI {
    readonly baseUrl: string = isProduction
        ? viper.getConfig().api_url.reader_v1
        : "http://localhost:8000";

    readonly baseUrlOAuth    = `${this.baseUrl}/oauth`;
    readonly baseUrlPreLogin = `${this.baseUrl}/users`;
    readonly baseUrlUser     = `${this.baseUrl}/user`;

    readonly oauthCode: string  = `${this.baseUrlOAuth}/code`
    readonly oauthToken: string = `${this.baseUrlOAuth}/token`;

    readonly exists: string              = `${this.baseUrlPreLogin}/exists`;
    readonly signup: string              = `${this.baseUrlPreLogin}/signup`;
    readonly login: string               = `${this.baseUrlPreLogin}/login`;
    verifyEmail(token: string): string {
        return `${this.baseUrlPreLogin}/verify/email/${token}`;
    }
    readonly passwordResetLetter: string = `${this.baseUrlPreLogin}/password-reset/letter`;
    passwordResetToken (token: string): string {
        return `${this.baseUrlPreLogin}/password-reset/tokens/${token}`;
    }
    readonly resetPassword: string       = `${this.baseUrlPreLogin}/password-reset`;

    readonly account: string                = `${this.baseUrlUser}/account/v2`;
    readonly profile: string                 = `${this.baseUrlUser}/profile`;
    readonly email: string                  = `${this.baseUrlUser}/email`;
    readonly requestVerification: string     = `${this.baseUrlUser}/email/request-verification`
    readonly name: string                   = `${this.baseUrlUser}/name`;
    readonly mobile: string                 = `${this.baseUrlUser}/mobile`;
    readonly password: string               = `${this.baseUrlUser}/password`;
    readonly wxAccount: string              = `${this.baseUrlUser}/wx/account/v2`;
    readonly wxSignUp: string               = `${this.baseUrlUser}/wx/signup`;

    readonly linking: string                = `${this.baseUrlUser}/wx/link`;
    readonly orders: string                 = `${this.baseUrlUser}/orders`;
    readonly address: string                = `${this.baseUrlUser}/address`;
    // newsletter: `${user}/newsletter`,
    readonly starred: string                = `${this.baseUrlUser}/starred`;
}

class SubAPI {
    readonly baseUrl: string = isProduction
        ? viper.getConfig().api_url.subscription_v1
        : "http://localhost:8200";

    readonly sandboxBaseUrl: string = viper
        .getConfig()
        .api_url
        .sub_sandbox;

    private getBaseUrl(sandbox: boolean): string {
        return sandbox ? this.sandboxBaseUrl : this.baseUrl;
    }

    aliPayDesktop(tier: Tier, cycle: Cycle, sandbox: boolean): string {
        return `${this.getBaseUrl(sandbox)}/alipay/desktop/${tier}/${cycle}`;
    }

    aliPayMobile(tier: Tier, cycle: Cycle, sandbox: boolean): string {
        return `${this.getBaseUrl(sandbox)}/alipay/mobile/${tier}/${cycle}`;
    }

    wxPayDesktop(tier: Tier, cycle: Cycle, sandbox: boolean): string {
        return `${this.getBaseUrl(sandbox)}/wxpay/desktop/${tier}/${cycle}`;
    }

    wxQueryOrder(orderId: string): string {
        return `${this.baseUrl}/wxpay/query/${orderId}`;
    }

    private readonly wxRedirectPath: string = "/wx/oauth/callback";

    // The sandbox mode is used only to test new API features.
    // As long as Wechat does not change its API, we do not need to use the sandbox mode.
    wxRedirect(sandbox: boolean = false): string {

        if (sandbox) {
            return `${viper.getConfig().api_url.sub_sandbox}${this.wxRedirectPath}`;
        }

        return `${this.baseUrl}${this.wxRedirectPath}`;
    }

    // Send wechat OAuth2 code here
    readonly wxLogin: string        = `${this.baseUrl}/wx/oauth/login`;
    
    readonly redeemGiftCard: string = `${this.baseUrl}/gift-card/redeem`;
}

export const readerApi = new ReaderAPI();
export const subsApi = new SubAPI();

// export const readerApi = {
//     oauthCode:    `${nextApiBase}/oauth/code`,
//     oauthToken:   `${nextApiBase}/oauth/token`,
//     exists:       `${nextApiBase}/users/exists`,
//     signup:       `${nextApiBase}/users/signup`,
//     login:        `${nextApiBase}/users/login`,
//     verifyEmail:  function (token: string): string {
//         return `${nextApiBase}/users/verify/email/${token}`;
//     },
//     passwordResetLetter: `${nextApiBase}/users/password-reset/letter`,
//     passwordResetToken: function (token: string): string {
//         return `${nextApiBase}/users/password-reset/tokens/${token}`;
//     },
//     resetPassword:  `${nextApiBase}/users/password-reset`,
//     account:        `${nextApiBase}/user/account/v2`,
    
//     profile:         `${nextApiBase}/user/profile`,
//     email:          `${nextApiBase}/user/email`,
//     requestVerification: `${nextApiBase}/user/email/request-verification`,
//     name:           `${nextApiBase}/user/name`,
//     mobile:         `${nextApiBase}/user/mobile`,
//     password:       `${nextApiBase}/user/password`,
//     wxAccount:    `${nextApiBase}/user/wx/account/v2`,
//     wxSignUp:     `${nextApiBase}/user/wx/signup`,

//     linking:       `${nextApiBase}/user/wx/link`,
//     orders:         `${nextApiBase}/user/orders`,
//     address:        `${nextApiBase}/user/address`,
//     // newsletter: `${user}/newsletter`,
//     starred:        `${nextApiBase}/user/starred`,
// };

// export const subsApi = {

//     wxRedirect: "/wx/oauth/callback",

//     // Send wechat OAuth2 code here
//     wxLogin: `${subsApiBase}/wx/oauth/login`,
  
//     wxQueryOrder: function(orderId: string): string {
//       return `${subsApiBase}/wxpay/query/${orderId}`;
//     },
    
//     redeemGiftCard: `${subsApiBase}/gift-card/redeem`,
// };
