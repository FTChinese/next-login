const prefix = '/user';

module.exports = {
  signup: `${prefix}/signup`,
  passwordReset: `${prefix}/password-reset`,
  login: `${prefix}/login`,
  logout: `${prefix}/logout`,
  profile: `${prefix}/profile`,
  email: `${prefix}/email`,
  emailRequestVerification: `${prefix}/email/request-verification`,
  emailNewsletter: `${prefix}/email/newsletter`,
  account: `${prefix}/account`,
  accountName: `${prefix}/account/name`,
  accountPassword: `${prefix}/account/password`,
  accountMobile: `${prefix}/account/mobile`,
  membership: `${prefix}/membership`,
  address: `${prefix}/address`,
  notification: `${prefix}/notification`,
  starred: `${prefix}/starred`,
  preference: `${prefix}/preference`
};