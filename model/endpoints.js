const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = "http://localhost:8000";
const user = `${baseUrl}/user`
const users = `${baseUrl}/users`
const passwordReset = `${users}/password-reset`;
const subsBaseUrl = isProduction 
  ? "http://www.ftacademy.cn/api/v1" 
  : "http://localhost:8200";
// const subsBaseUrl = "http://www.ftacademy.cn/api/sandbox";

exports.nextApi = {
  signup: `${users}/signup`,
  login: `${users}/login`,
  verifyEmail: function (token) {
    return `${users}/verify/email/${token}`;
  },
  passwordResetLetter: `${passwordReset}/letter`,
  passwordResetToken: function (token) {
    return `${passwordReset}/tokens/${token}`;
  },
  resetPassword: passwordReset,

  account: `${user}/account`,
  wxAccount: `${baseUrl}/wx/account`,
  profile: `${user}/profile`,
  email: `${user}/email`,
  requestVerification: `${user}/email/request-verification`,
  name: `${user}/name`,
  mobile: `${user}/mobile`,
  password: `${user}/password`,
  orders: `${user}/orders`,
  address: `${user}/address`,
  // newsletter: `${user}/newsletter`,
  starred: `${user}/starred`,
};

exports.subsApi = {
  wxDesktopOrder: function (tier, cycle) {
    return `${subsBaseUrl}/wxpay/desktop/${tier}/${cycle}`;
  },

  wxMobileOrder: function (tier, cycle) {
    return `${subsBaseUrl}/wxpay/mobile/${tier}/${cycle}`;
  },

  aliDesktopOrder: function (tier, cycle) {
    return `${subsBaseUrl}/alipay/desktop/${tier}/${cycle}`;
  },

  aliMobileOrder: function (tier, cycle) {
    return `${subsBaseUrl}/alipay/mobile/${tier}/${cycle}`;
  }
};
