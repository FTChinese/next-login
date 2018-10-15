const prefix = '/user';

const sitemap = {
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
  address: `${prefix}/address`
};

const navItems = [
  {
    href: sitemap.profile,
    text: "我的资料"
  },
  {
    href: sitemap.email,
    text: "邮箱"
  },
  {
    href: sitemap.account,
    text: "账号安全"
  },
  {
    href: sitemap.membership,
    text: "会员"
  },
  {
    href: sitemap.address,
    text: "地址"
  }
];

module.exports = function() {
  return async (ctx, next) => {
    const path = ctx.path;

    ctx.state.sideNav = navItems.map(item => {
      return {
        href: item.href,
        text: item.text,
        active: path.startsWith(item.href) ? true : false
      };
    });

    ctx.state.sitemap = sitemap;

    return await next();
  }
}