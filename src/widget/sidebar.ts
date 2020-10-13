import { profileMap, accountMap, subsMap, starredMap, entranceMap } from "../config/sitemap";
import { Link } from "./link";

export type SidebarItem = Link & {
  active: boolean
}

export const sidebarItems: SidebarItem[] = [
  {
    href: profileMap.base,
    text: "我的资料",
    active: false,
  },
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

export function buildSidebar(currentPath: string): SidebarItem[] {
  return sidebarItems.map(item => {
    item.active = currentPath.startsWith(item.href);
    return item; 
  })
}
