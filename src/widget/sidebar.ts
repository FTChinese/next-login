import { profileMap, accountMap, subsMap, starredMap, entranceMap } from "../config/sitemap";
import { Account, getReaderName } from "../models/account";
import { Link } from "./link";

export type SidebarItem = Link & {
  active: boolean
}

export const sidebarItems: SidebarItem[] = [
  {
    href: accountMap.base,
    text: "账号安全",
    active: false,
  },
  {
    href: subsMap.base,
    text: "会员",
    active: false,
  },
  {
    href: starredMap.base,
    text: "收藏的文章",
    active: false,
  },
  {
    href: entranceMap.logout,
    text: "退出",
    active: false,
  },
];

export function buildSidebar(currentPath: string, a?: Account): SidebarItem[] {
  return [{
    href: profileMap.base,
    text: a ? getReaderName(a) : '我的资料',
    active: false,
  }]
    .concat(sidebarItems)
    .map(item => {
      item.active = currentPath.startsWith(item.href);
      return item; 
    });
}
