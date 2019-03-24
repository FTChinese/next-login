const baseUrl = "http://localhost:8000";
const user = `${baseUrl}/user`
const users = `${baseUrl}/users`
const passwordReset = `${users}/password-reset`;

exports.nextApi = {
  signup: `${users}/signup`,
  login: `${users}/login`,
  verifyEmail: `${users}/verify/email`, // append toke to the end
  passwordResetLetter: `${passwordReset}/letter`,
  verifyPasswordResetToken: `${passwordReset}/tokens`, // append token to the end.
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

};
