const prefix = require("../lib/config").urlPrefix;

const sitemap = exports.sitemap = {
  signup:         `${prefix}/signup`,
  passwordReset:  `${prefix}/password-reset`,
  login:          `${prefix}/login`,
  wxLogin:        `${prefix}/login/wechat`,
  authorize:      `${prefix}/authorize`,
  logout:         `${prefix}/logout`,
  profile:         `${prefix}/profile`,
  displayName:    `${prefix}/profile/display-name`,
  mobile:         `${prefix}/profile/mobile`,
  personal:       `${prefix}/profile/info`,
  address:        `${prefix}/profile/address`,
  account:        `${prefix}/account`,
  email:          `${prefix}/account/email`,
  password:       `${prefix}/account/password`,
  requestVerification: `${prefix}/account/request-verification`,
  bindEmail:      `${prefix}/account/bind/email`,
  bindLogin:      `${prefix}/account/bind/login`,
  bindMerge:      `${prefix}/account/bind/merge`,
  bindSignUp:     `${prefix}/account/bind/signup`,
  subs:           `${prefix}/subscription`,
  subsTest:       `${prefix}/subscription/test`,
  renewal:        `${prefix}/subscription/renew`,
  payment: function(tier, cycle) {
    return `${prefix}/subscription/pay/${tier}/${cycle}`;
  },
  notification:    `${prefix}/notification`,
  newsletter:     `${prefix}/newsletter`,
  starred:        `${prefix}/starred`,
  preference:     `${prefix}/preference`
}

exports.sidebarNav = [
  {
    href: sitemap.profile,
    text: "我的资料"
  },
  {
    href: sitemap.account,
    text: "账号安全"
  },
  {
    href: sitemap.subs,
    text: "会员"
  },
  // {
  //   href: sitemap.notification,
  //   text: "通知推送"
  // },
  {
    href: sitemap.starred,
    text: "收藏的文章"
  },
  // {
  //   href: sitemap.preference,
  //   text: "我的偏好"
  // }
];
