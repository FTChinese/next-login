const baseUrl = "http://localhost:8000";
const passwordReset = `${baseUrl}/users/password-reset`;
const user = `${baseUrl}/user`

module.exports = {
  createAccount: `${baseUrl}/users/new`,
  login: `${baseUrl}/users/auth`,
  resetLetter: `${passwordReset}/letter`,
  verifyResetToken: `${passwordReset}/tokens`,
  passwordReset,
  profile: `${user}/profile`,
  email: `${user}/email`,
  verifyEmail: `${user}/verify`,
  requestVerification: `${user}/email/request-verification`,
  name: `${user}/name`,
  mobile: `${user}/mobile`,
  password: `${user}/password`,
  address: `${user}/address`,
  newsletter: `${user}/newsletter`,
};