const baseUrl = "http://localhost:8000";
const passwordReset = `${baseUrl}/users/password-reset`;
const user = `${baseUrl}/user`
const users = `${baseUrl}/users`

module.exports = {
  signup: `${users}/new`,
  verifyEmail: `${user}/verify/email`, // append toke to the end
  sendPasswordResetLetter: `${users}/letter`,
  verifyPasswordResetToken: `${users}/password-reset/tokens`, // append token to the end.
  resetPassword: `${users}/password-reset`,
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
};