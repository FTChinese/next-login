import { isProduction } from "./viper";

export const nextApiBase = isProduction
    ? "http://api.ftchinese.com/v1"
    : "http://localhost:8000";

export const subsApiBase = isProduction
    ? "http://www.ftacademy.cn/api/v1"
    : "http://localhost:8200";

export const subsSandboxBase = "http://www.ftacademy.cn/api/sandbox";

export const KEY_USER_ID = "X-User-Id";
export const KEY_UNION_ID = "X-Union-Id";
export const KEY_APP_ID = "X-App-Id";

export const readerApi = {
    oauthCode:    `${nextApiBase}/oauth/code`,
    oauthToken:   `${nextApiBase}/oauth/token`,
    exists:       `${nextApiBase}/users/exists`,
    signup:       `${nextApiBase}/users/signup`,
    login:        `${nextApiBase}/users/login`,
    verifyEmail:  function (token: string): string {
        return `${nextApiBase}/users/verify/email/${token}`;
    },
    passwordResetLetter: `${nextApiBase}/users/password-reset/letter`,
    passwordResetToken: function (token: string): string {
        return `${nextApiBase}/users/password-reset/tokens/${token}`;
    },
    resetPassword:  `${nextApiBase}/users/password-reset`,
    account:        `${nextApiBase}/user/account`,
    
    profile:         `${nextApiBase}/user/profile`,
    email:          `${nextApiBase}/user/email`,
    requestVerification: `${nextApiBase}/user/email/request-verification`,
    name:           `${nextApiBase}/user/name`,
    mobile:         `${nextApiBase}/user/mobile`,
    password:       `${nextApiBase}/user/password`,
    wxAccount:    `${nextApiBase}/user/wx/account`,
    wxSignUp:     `${nextApiBase}/user/wx/signup`,
    wxMerge:      `${nextApiBase}/user/wx/link`,

    linkWx:       `${nextApiBase}/user/wx/link`,
    orders:         `${nextApiBase}/user/orders`,
    address:        `${nextApiBase}/user/address`,
    // newsletter: `${user}/newsletter`,
    starred:        `${nextApiBase}/user/starred`,
};

export const subsApi = {

    wxRedirect: "/wx/oauth/callback",

    // Send wechat OAuth2 code here
    wxLogin: `${subsApiBase}/wx/oauth/login`,
  
    wxQueryOrder: function(orderId: string): string {
      return `${subsApiBase}/wxpay/query/${orderId}`;
    },
    
    redeemGiftCard: `${subsApiBase}/gift-card/redeem`,
};
