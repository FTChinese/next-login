const sitemap = require("../lib/sitemap");

const navItems = [
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
  {
    href: sitemap.address,
    text: "地址"
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

module.exports = function() {
  return async (ctx, next) => {
    const path = ctx.path;

    ctx.state.sideNav = navItems.map(item => {
      return {
        href: item.href,
        text: item.text,
        active: path === item.href,
      };
    });

    ctx.state.sitemap = sitemap;

    return await next();
  }
}