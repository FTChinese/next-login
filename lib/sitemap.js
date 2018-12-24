const prefix = '/user';

module.exports = {
  signup: `${prefix}/signup`,
  passwordReset: `${prefix}/password-reset`,
  login: `${prefix}/login`,
  logout: `${prefix}/logout`,
  profile: `${prefix}/profile`,
  userName: `${prefix}/profile/name`,
  mobile: `${prefix}/profile/mobile`,
  account: `${prefix}/account`,
  email: `${prefix}/account/email`,
  password: `${prefix}/account/password`,
  requestVerification: `${prefix}/account/request-verification`,
  subs: `${prefix}/subscription`,
  address: `${prefix}/address`,
  notification: `${prefix}/notification`,
  newsletter: `${prefix}/newsletter`,
  starred: `${prefix}/starred`,
  preference: `${prefix}/preference`
};