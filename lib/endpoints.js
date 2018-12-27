const baseUrl = "http://localhost:8000";
const user = `${baseUrl}/user`
const users = `${baseUrl}/users`
const passwordReset = `${users}/password-reset`;

exports.nextApi = {
  signup: `${users}/new`,
  verifyEmail: `${users}/verify/email`, // append toke to the end
  sendPasswordResetLetter: `${passwordReset}/letter`,
  verifyPasswordResetToken: `${passwordReset}/tokens`, // append token to the end.
  resetPassword: passwordReset,
  login: `${users}/auth`,
  account: `${user}/account`,
  profile: `${user}/profile`,
  email: `${user}/email`,
  requestVerification: `${user}/email/request-verification`,
  name: `${user}/name`,
  mobile: `${user}/mobile`,
  password: `${user}/password`,
  address: `${user}/address`,
  newsletter: `${user}/newsletter`,
  starred: `${user}/starred`,
};

exports.subsApi = {

};