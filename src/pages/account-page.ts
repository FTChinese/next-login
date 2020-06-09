import {
  APIError,
} from "../models/api-response";
import {
  Account, isAccountLinked,
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
import { RequestLocation } from "../models/request-data";

interface AccountPage {
  flash?: Flash;
  link: {
    email: string;
    password: string;
    wechat: string;
  }
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

  async requestVerification(source: RequestLocation, app: IHeaderApp): Promise<boolean> {
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
    const page: AccountPage = {
      link: {
        email: accountMap.email,
        password: accountMap.password,
        wechat: isAccountLinked(this.account)
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

