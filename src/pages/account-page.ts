import debug from "debug";
import {
  APIError,
} from "../models/api-response";
import {
  Account, isAccountLinked, isAccountWxOnly,
} from "../models/account";
import {
  HeaderApp,
} from "../models/header";
import {
  accountService,
} from "../repository/account";
import {
  accountMap,
  entranceMap,
} from "../config/sitemap";
import { KeyUpdated, getMsgUpdated } from "./redirection";
import { Flash } from "../widget/flash";
import { RequestLocation } from "../models/request-data";
import { TableSection } from "../widget/list";

const log = debug("user:account-page");

/** template: account/account.html */
interface AccountPage {
  pageTitle: string,
  flash?: Flash;
  isWxOnly: boolean;
  linkFtcUrl: string;
  sections: TableSection[];
}

export class AccountPageBuilder {

  flashMsg?: string;
  errors: Map<string, string> = new Map();
  account: Account;

  constructor (account: Account) {
    this.account = account;
  }

  async refresh(): Promise<boolean> {
    try {
      
      this.account = await accountService.refreshAccount(this.account);

      return true;
    } catch (e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;
      return false;
    }
  }

  async requestVerification(source: RequestLocation, app: HeaderApp): Promise<boolean> {
    try {
      const ok = await accountService.requestVerification(this.account.id, source, app);

      return ok;
    } catch (e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;

      return false;
    }
  }

  build(done?: KeyUpdated): AccountPage {

    const isLinked = isAccountLinked(this.account);

    const page: AccountPage = {
      pageTitle: "账号安全",
      isWxOnly: isAccountWxOnly(this.account),
      linkFtcUrl: accountMap.linkEmail,
      sections: [],
    };

    if (!page.isWxOnly) {
      page.sections = [
        {
          header: undefined,
          rows: [
            {
              cells: [
                {
                  left: "登录邮箱",
                  right: this.account.email
                }
              ],
              disclosure: {
                text: "修改",
                href: accountMap.email,
              },
            },
            {
              cells: [
                {
                  left: "密码",
                  right: ""
                }
              ],
              disclosure: {
                text: "修改",
                href: accountMap.password,
              },
            },
          ]
        },
        {
          header: "账号绑定",
          rows: [
            isLinked ? {
              cells: [
                {
                  left: "微信",
                  right: `已绑定 ${this.account.wechat.nickname}`
                }
              ],
              disclosure: {
                text: "解除绑定",
                href: accountMap.unlinkWx,
              },
            } : {
              cells: [
                {
                  left: "微信",
                  right: "",
                },
              ],
              disclosure: {
                text: "尚未绑定",
                href: entranceMap.wxLogin
              }
            },
          ],
        },
      ];
    }

    console.log("Account page: %O", page);

    if (done) {
      page.flash = Flash.success(getMsgUpdated(done));

      return page;
    }

    if (this.flashMsg) {
      page.flash = Flash.danger(this.flashMsg);

      return page;
    }
    
    return page;
  }
}

