import {
  accountService,
} from "../repository/account";
import { APIError } from "../models/api-response";
import { accountMap, entranceMap } from "../config/sitemap";
import { Link } from "../widget/link";
import { Account } from "../models/account";

interface EmailVerifiedPage {
  message: string;
  link: Link;
}

export class EmailVerifiedBuilder {
  account?: Account
  message?: string;

  constructor(account?: Account) {
    this.account = account;
  }

  async verify(token: string): Promise<boolean> {
    try {
      const ok = await accountService.verifyEmail(token);

      this.message = "邮箱已验证！";
      return ok;
    } catch (e) {
      const errResp = new APIError(e);
      if (errResp.notFound) {
        this.message = "邮箱验证失败！";
        return false;
      }

      this.message = errResp.message;
      return false;
    }
  }

  build(): EmailVerifiedPage {
    return {
      message: this.message || "",
      link: this.account
        ? {
          href: accountMap.base,
          text: "返回",
        }
        : {
          href: entranceMap.login,
          text: "登录",
        },
    };
  }
}

