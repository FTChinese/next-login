import {
  CallbackParams,
  OAuthSession,
  WxSession,
} from "../models/wx-oauth";
import {
  Account,
} from "../models/reader";
import {
  IHeaderApp,
} from "../models/header";
import {
  isExpired,
} from "../util/time";
import { entranceMap, accountMap } from "../config/sitemap";
import { accountService } from "../repository/account";
import { APIError } from "../models/api-response";
import { Flash } from "../widget/flash";

/**
 * @description The UI if Wechat OAuth login failed.
 */
interface WxCallbackPage {
  flash?: Flash;
  reason?: CallbackParams;
  link: string;
}

const errMsg = {
  state: {
    missing_field: "请求缺失参数",
    mismatched: "无效的访问",
    expired: "状态已失效",
  },
  code: {
    missing_field: "您拒绝了微信授权",
  },
  session: {
    missing: "无效的session",
  },
}
export class WxCallbackBuilder {

  errors: Map<string, string> = new Map();
  flashMsg?: string;
  code: string;

  /**
   * 
   * @param account User's current account if logged in.
   */
  constructor(readonly account?: Account) {}
  /**
   * @description Validate OAuth callback data.
   * Treat the query parameter as form inputs.
   */
  validate(params: CallbackParams, sess?: OAuthSession): boolean {

    if (!sess) {
      this.flashMsg = errMsg.session.missing;
      return false;
    }

    if (!params.state && !params.code) {
      this.errors.set("state", errMsg.state.missing_field);
      this.errors.set("code", errMsg.code.missing_field);
      return false;
    }

    if (!params.code) {
      this.errors.set("code", errMsg.code.missing_field);
      return false;
    }

    if (!params.state) {
      this.errors.set("state", errMsg.state.missing_field);
      return false;
    }

    params.state = params.state.trim();
    params.code = params.code.trim();

    if (params.state != sess.state) {
      this.errors.set("state", errMsg.state.mismatched);
      return false;
    }

    // The session is valid for 5 minutes
    if (isExpired(sess.created, 5 * 60)) {
      this.errors.set("state", errMsg.state.expired);
      return false;
    }

    this.code = params.code;
    return true;
  }

  async getApiSession(app: IHeaderApp): Promise<WxSession | null> {

    try {
      const wxSession = await accountService.fetchWxSession(this.code, app);
      
      return wxSession;
    } catch (e) {
      const errResp = new APIError(e);

      this.flashMsg = errResp.message;
      return null;
    }
  }

  buildUI(): WxCallbackPage {
    return {
      flash: this.flashMsg
        ? Flash.danger(this.flashMsg)
        : undefined,
      reason: {
        state: this.errors.get("state"),
        code: this.errors.get("code"),
      },
      link: this.account 
        ? accountMap.base
        : entranceMap.login,
    };
  }

  async getAccount(unionId: string): Promise<Account | null> {
    try {
      const account = await accountService.fetchWxAccount(unionId);

      return account;
    } catch (e) {

      const errResp = new APIError(e);
      this.flashMsg = errResp.message;

      return null;
    }
  }
}

