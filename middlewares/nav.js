const navItems = [
  {
    href: "/profile",
    text: "我的资料"
  },
  {
    href: "/email",
    text: "邮箱"
  },
  {
    href: "/account",
    text: "账号安全"
  },
  {
    href: "/membership",
    text: "会员"
  },
  {
    href: "/address",
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

    return await next();
  }
}