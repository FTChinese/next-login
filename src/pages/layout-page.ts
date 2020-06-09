import { Account, isAccountFtcOnly } from "../models/account";
import { accountMap, profileMap, subsMap, starredMap, entranceMap } from "../config/sitemap";
import { Link } from "../widget/link";
import { isProduction } from "../config/viper";
const pkg = require("../../package.json");

interface FooterSection {
  title: string;
  items: Link[];
}

interface BaseLayoutPage {
  iconUrl: string;
  pageTitle: string;
  env: {
    isProd: boolean;
    year: number;
    footer: FooterSection[];
    version: string;
    bsVersion: string;
    bsNativeVersion: string
  }
}

const footer: FooterSection[] = [
  {
    "title": "支持",
    "items": [
      {
        "text": "关于我们",
        "href": "http://www.ftchinese.com/m/corp/aboutus.html"
      },
      {
        "text": "职业机会",
        "href": "http://www.ftchinese.com/jobs/?from=ft"
      },
      {
        "text": "问题回馈",
        "href": "http://www.ftchinese.com/m/corp/faq.html"
      },
      {
        "text": "联系方式",
        "href": "http://www.ftchinese.com/m/corp/contact.html"
      }
    ]
  },
  {
    "title": "法律事务",
    "items": [

      {
        "text": "服务条款",
        "href": "http://www.ftchinese.com/m/corp/service.html"
      },
      {
        "text": "版权声明",
        "href": "http://www.ftchinese.com/m/corp/copyright.html"
      }
    ]
  },
  {
    "title": "服务",
    "items": [
      {
        "text": "广告业务",
        "href": "http://www.ftchinese.com/m/corp/sales.html"
      },
      {
        "text": "会议活动",
        "href": "http://www.ftchinese.com/m/events/event.html"
      },
      {
        "text": "会员信息中心",
        "href": "http://www.ftchinese.com/m/marketing/home.html"
      },
      {
        "text": "最新动态",
        "href": "http://www.ftchinese.com/m/marketing/ftc.html"
      },
      {
        "text": "合作伙伴",
        "href": "http://www.ftchinese.com/m/corp/partner.html"
      }
    ]
  },
  {
    "title": "关注我们",
    "items": [
      {
        "text": "微信",
        "href": "http://www.ftchinese.com/m/corp/follow.html"
      },
      {
        "text": "微博",
        "href": "http://weibo.com/ftchinese"
      },
      {
        "text": "Linkedin",
        "href": "https://www.linkedin.com/company/4865254?trk=hp-feed-company-name"
      },
      {
        "text": "Facebook",
        "href": "https://www.facebook.com/financialtimeschinese"
      },
      {
        "text": "Twitter",
        "href": "https://twitter.com/FTChinese"
      }
    ]
  },
  {
    "title": "FT产品",
    "items": [
      
      {
        "text":"FT研究院",
        "href": "http://www.ftchinese.com/m/marketing/intelligence.html"
      },
      {
        "text":"FT商学院",
        "href": "http://www.ftchinese.com/channel/mba.html"
      },
      {
        "text":"FT电子书",
        "href": "http://www.ftchinese.com/m/marketing/ebook.html"
      },
      {
        "text":"数据新闻",
        "href": "http://www.ftchinese.com/channel/datanews.html"
      },
      {
        "text": "FT英文版",
        "href": "https://www.ft.com/"
      }
    ]
  },
  {
    "title": "移动应用",
    "items": [
      {
        "text": "安卓",
        "href": "/android/latest"
      }
    ]
  }
];

/**
 * The data is added in env() middleware.
 */
export function buildBaseLayoutPage(): BaseLayoutPage {
  return {
    iconUrl: "http://interactive.ftchinese.com/favicons",
    pageTitle: "我的FT",
    env: {
      isProd: isProduction,
      year: new Date().getFullYear(),
      footer,
      version: pkg.version,
      bsVersion: pkg.devDependencies.bootstrap.replace("^", ""),
      bsNativeVersion: pkg.devDependencies["bootstrap.native"].replace("^", "")
    },
  };
}

type SidebarItem = Link & {
  active: boolean
}

const sidebarItems: SidebarItem[] = [
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

/**
 * @description Data used to render content.html
 */
interface ContentLayoutPage {
  requestVerificationAction?: string;
  sideNav: SidebarItem[];
}

/** The data is added to global context.state in checkSession() middleware. It will be added only when user session exists. */
export function buildContentPage(account: Account, currentPath: string): ContentLayoutPage {
  return {
    requestVerificationAction: isAccountFtcOnly(account) && !account.isVerified
      ? accountMap.requestVerification
      : undefined,
    sideNav: sidebarItems.map(item => {
      item.active = currentPath.startsWith(item.href);
      return item; 
    }),
  };
}
