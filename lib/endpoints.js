const {
  baseUrl,
} = require("./config");
const {
  PAY_ALI,
  PAY_WX,
} = require("./enum");

const nextApiBase = baseUrl.getNextApi();
const subsApiBase = baseUrl.getSubsApi();

exports.nextApi = {
  oauthCode:    `${nextApiBase}/oauth/code`,
  oauthToken:   `${nextApiBase}/oauth/token`,
  
  wxAccount:    `${nextApiBase}/wx/account`,
  wxSignUp:     `${nextApiBase}/wx/signup`,
  wxMerge:      `${nextApiBase}/wx/bind`,

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
  orders:         `${nextApiBase}/user/orders`,
  address:        `${nextApiBase}/user/address`,
  // newsletter: `${user}/newsletter`,
  starred:        `${nextApiBase}/user/starred`,
};

exports.subsApi = {
  // Receive wechat OAuth2 code here.
  wxOAuthRedirect: function(sandbox=false) {
    return `${baseUrl.getSubsApi(sandbox)}/wx/oauth/callback`;
  },

  wxQueryOrder: function(orderId) {
    return `${baseUrl.getSubsApi()}/wxpay/query/${orderId}`;
  },
  
  redeemGiftCard: `${subsApiBase}/gift-card/redeem`,
  
  // Send wechat OAuth2 code here
  wxLogin: `${subsApiBase}/wx/oauth/login`,
};

exports.wxOAuthApi = {
  code: "https://open.weixin.qq.com/connect/qrconnect",
};

/**
 * @description Build url for subscription order.
 * @example
 * ```
 * new OrderUrlBuilder()
 *  .setTier("standard")
 *  .setCycle("year")
 *  .setSandbox(false)
 *  .buildAliMobile();
 * ```
 */
class OrderUrlBuilder {
  constructor() {
    /**
     * @type {"standard" | "premium"} 
     */
    this.tier = "";
    /**
     * @type {"year" | "month"}
     */
    this.cycle = "";
    /**
     * @type {"alipay" | "wxpay"}
     */
    this.payMethod = "";
    /**
     * @type {"desktop" | "mobile" | "jsapi"} - jsapi only applicable when payMethod === "wxpay"
     */
    this.platform = "";
    /**
     * Determine whether to use API sandbox.
     */
    this.sandbox = false;
  }

  setAlipay() {
    this.payMethod = PAY_ALI;
    return this;
  }

  setWxpay() {
    this.payMethod = PAY_WX;
    return this;
  }

  setDesktop() {
    this.platform = "desktop";
  }

  setMobile() {
    this.platform = "mobile";
  }

  setTier(tier) {
    this.tier = tier;
    return this;
  }

  setCycle(cycle) {
    this.cycle = cycle;
    return this;
  }

  /**
   * @param {boolean} isSandbox 
   */
  setSandbox(isSandbox) {
    this.sandbox = isSandbox;
    return this;
  }

  build() {
    if (!this.payMethod) {
      throw new Error("Payment method is not set");
    }
    if (!this.platform) {
      throw new Error("Platform not set");
    }

    if (!this.tier) {
      throw new Error("Tier not set");
    }

    if (!this.cycle) {
      throw new Error("Cycle not set");
    }

    if (this.tier == "premium" && this.cycle == "month") {
      throw new Error("Premium membership does not support monthly subscription");
    }
    return `${baseUrl.getSubsApi(this.sandbox)}/${this.payMethod}/${this.platform}/${this.tier}/${this.cycle}`;
  }

  buildWxDesktop() {
    this.setWxpay().setDesktop();
    return this.build();
  }

  buildWxMobile() {
    this.setWxpay().setMobile();
    return this.build();
  }

  buildAliDesktop() {
    this.setAlipay().setDesktop();
    return this.build();
  }

  buildAliMobile() {
    this.setAlipay().setMobile();
    return this.build();
  }
}

exports.OrderUrlBuilder = OrderUrlBuilder;

