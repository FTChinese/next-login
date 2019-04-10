const {
  baseUrl,
} = require("./config");

const nextApiBase = baseUrl.getNextApi();
const subsApiBase = baseUrl.getSubsApi();

exports.nextApi = {
  oauthCode: `${nextApiBase}/oauth/code`,
  oauthToken: `${nextApiBase}/oauth/token`,
  
  signup: `${nextApiBase}/users/signup`,
  login: `${nextApiBase}/users/login`,
  verifyEmail: function (token) {
    return `${nextApiBase}/users/verify/email/${token}`;
  },
  passwordResetLetter: `${nextApiBase}/users/password-reset/letter`,
  passwordResetToken: function (token) {
    return `${nextApiBase}/users/password-reset/tokens/${token}`;
  },
  resetPassword: `${nextApiBase}/users/password-reset`,
  account: `${nextApiBase}/user/account`,
  wxAccount: `${nextApiBase}/wx/account`,
  profile: `${nextApiBase}/user/profile`,
  email: `${nextApiBase}/user/email`,
  requestVerification: `${nextApiBase}/user/email/request-verification`,
  name: `${nextApiBase}/user/name`,
  mobile: `${nextApiBase}/user/mobile`,
  password: `${nextApiBase}/user/password`,
  orders: `${nextApiBase}/user/orders`,
  address: `${nextApiBase}/user/address`,
  // newsletter: `${user}/newsletter`,
  starred: `${nextApiBase}/user/starred`,
};

exports.subsApi = {
  wxDesktopOrder: function (tier, cycle) {
    return `${subsApiBase}/wxpay/desktop/${tier}/${cycle}`;
  },

  wxMobileOrder: function (tier, cycle) {
    return `${subsApiBase}/wxpay/mobile/${tier}/${cycle}`;
  },

  aliDesktopOrder: function (tier, cycle) {
    return `${subsApiBase}/alipay/desktop/${tier}/${cycle}`;
  },

  aliMobileOrder: function (tier, cycle) {
    return `${subsApiBase}/alipay/mobile/${tier}/${cycle}`;
  }
};
