import { isProduction } from "./viper";

export const subsSandbox = "http://www.ftacademy.cn/api/sandbox";

export const nextApiBase = isProduction
    ? "http://api.ftchinese.com/v1"
    : "http://localhost:8000";

export const subsApiBase = isProduction
    ? "http://www.ftacademy.cn/api/v1"
    : "http://localhost:8200";

export const KEY_USER_ID = "X-User-Id";
export const KEY_UNION_ID = "X-Union-Id";

export const readerApi = {
    oauthCode:    `${nextApiBase}/oauth/code`,
    oauthToken:   `${nextApiBase}/oauth/token`,
    exists:       `${nextApiBase}/users/exists`,
    signup:       `${nextApiBase}/users/signup`,
    login:        `${nextApiBase}/users/login`,
    verifyEmail:  function (token) {
        return `${nextApiBase}/users/verify/email/${token}`;
    },
    passwordResetLetter: `${nextApiBase}/users/password-reset/letter`,
    passwordResetToken: function (token) {
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
    // Receive wechat OAuth2 code here.
    wxOAuthRedirect: function(sandbox=false) {
      const p = "wx/oauth/callback";
  
      // If sandbox if true, always use online sandbox url; otherwise use online production url.
      // localhost is meaningless for wechat oauth.
      return `${sandbox ? subsSandbox : subsApi}/wx/oauth/callback`;
    },
  
    wxQueryOrder: function(orderId) {
      return `${subsApiBase}/wxpay/query/${orderId}`;
    },
    
    redeemGiftCard: `${subsApiBase}/gift-card/redeem`,
    
    // Send wechat OAuth2 code here
    wxLogin: `${subsApiBase}/wx/oauth/login`,
  };
