const baseUrl = "http://localhost:8000";
const user = `${baseUrl}/user`
const users = `${baseUrl}/users`
const passwordReset = `${users}/password-reset`;
const subsBaseUrl = "http://localhost:8200";

exports.nextApi = {
  signup: `${users}/signup`,
  login: `${users}/login`,
  verifyEmail: function(token) {
    return `${users}/verify/email/${token}`;
  },
  passwordResetLetter: `${passwordReset}/letter`,
  passwordResetToken: function(token) {
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
  wxUnifiedOrder: function(tier, cycle) {
    return `${subsBaseUrl}/wxpay/web/${tier}/${cycle}`;
  },

  aliWebOrder: function(tier, cycle) {
    return `${subsBaseUrl}/alipay/web/${tier}/${cycle}`;
  },
};
