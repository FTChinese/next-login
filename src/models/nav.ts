import {
    profileMap,
    accountMap,
    subsMap,
    starredMap,
} from "../config/sitemap";

export const sidebar = [
    {
      href: profileMap.base,
      text: "我的资料",
      desktop: true,
    },
    {
      href: accountMap.base,
      text: "账号安全"
    },
    {
      href: subsMap.base,
      text: "会员"
    },
    // {
    //   href: sitemap.notification,
    //   text: "通知推送"
    // },
    {
      href: starredMap.base,
      text: "收藏的文章"
    },
    // {
    //   href: sitemap.preference,
    //   text: "我的偏好"
    // }
]
