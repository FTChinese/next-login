import {
  APIError,
} from "../models/api-response";
import {
  Account,
} from "../models/reader";
import {
  IHeaderApp,
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

interface AccountPage {
  flash?: Flash;
  link: {
    email: string;
    password: string;
    wechat: string;
  }
}

const msgNotFound = "用户不存在或服务器错误！";

export class AccountPageBuilder {

  flashMsg?: string;
  errors: Map<string, string> = new Map();
  account: Account;

  constructor (account: Account) {
    this.account = account;
  }

  async refresh(): Promise<boolean> {
    try {
      switch (this.account.loginMethod) {
        case "email": {
          const acnt = await accountService.fetchFtcAccount(this.account.id);
          this.account = acnt;

          return true;
        }

        case "wechat": {
          const acnt = await accountService.fetchWxAccount(this.account.unionId!);
          this.account = acnt;
          
          return true;
        }
      }
    } catch (e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;
      return false;
    }
  }

  async requestVerification(app: IHeaderApp): Promise<boolean> {
    try {
      const ok = await accountService.requestVerification(this.account.id, app);

      return ok;
    } catch (e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;

      return false;
    }
  }

  build(done?: KeyUpdated): AccountPage {
    const page: AccountPage = {
      link: {
        email: accountMap.email,
        password: accountMap.password,
        wechat: this.account.isLinked()
          ? accountMap.unlinkWx
          : entranceMap.wxLogin,
      }
    };

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

