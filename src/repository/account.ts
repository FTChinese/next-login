import request from "superagent";
import {
  readerApi,
  subsApi,
} from "./api";
import {
  Account,
} from "../models/account";
import {
  HeaderApp, KEY_USER_ID, KEY_UNION_ID, KEY_APP_ID,
} from "../models/header";
import {
  WxSession
} from "../models/wx-oauth";
import {
  viper
} from "../config/viper";
import { AccountKind } from "../models/enums";
import { oauth, noCache } from "../util/request";
import { EmailForm, Credentials, AccountFields } from "../models/form-data";
import { PwResetLetter, PasswordResetter, PasswordUpdater } from "../models/request-data";

class AccountService {

  /**
   * @description Fetch an ftc account by uuid.
   */
  async fetchFtcAccount(id: string): Promise<Account> {
    const resp = await request
      .get(readerApi.account)
      .use(oauth)
      .use(noCache)
      .set(KEY_USER_ID, id);

    return resp.body;
  }

  async refreshAccount(account: Account): Promise<Account> {
    switch (account.loginMethod) {
      case "email": {
        const acnt = await accountService.fetchFtcAccount(account.id);

        return acnt;
      }

      case "wechat": {
        const acnt = await accountService.fetchWxAccount(account.unionId!);

        return acnt;
      }
    }
  }

  /**
   * @description As the first step of login process, or verify password when linking accounts.
   */
  async authenticate(c: Credentials, app: HeaderApp): Promise<Account> {
    console.log(c);

    const resp = await request
      .post(readerApi.login)
      .use(oauth)
      .use(noCache)
      .set(app)
      .send(c);

    return resp.body;
  }

  async emailExists(email: string): Promise<boolean> {
    try {
      const resp = await request
        .get(readerApi.exists)
        .use(oauth)
        .use(noCache)
        .query({
          k: "email",
          v: email,
        });

      return resp.noContent;

    } catch (e) {
      switch (e.status) {
        case 404:
          return false;

        default:
          throw e;
      }
    }
  }

  async createReader(c: Credentials, app: HeaderApp): Promise<string> {
    const resp = await request
      .post(readerApi.signup)
      .use(oauth)
      .use(noCache)
      .set(app)
      .send(c);

    const body = resp.body;

    if (body.id) {
      return body.id;
    }

    throw new Error("Incorrect api response");
  }

  async fetchWxSession(code: string, app: HeaderApp): Promise<WxSession> {
    const appId = viper.getConfig().wxapp.web_oauth.app_id;

    const resp = await request
      .post(subsApi.wxLogin)
      .use(oauth)
      .use(noCache)
      .set(app)
      .set(KEY_APP_ID, appId)
      .send({ code });

    return resp.body;
  }

  // Fetch Wechat account by union id.
  async fetchWxAccount(unionId: string): Promise<Account> {
    const resp = await request
      .get(readerApi.wxAccount)
      .use(oauth)
      .use(noCache)
      .set(KEY_UNION_ID, unionId);

    return resp.body;
  }

  // Create an account for a wechat-logged-in user,
  // and returns the account's uuid.
  async wxSignUp(c: Credentials, unionId: string, app: HeaderApp): Promise<Account> {
    const resp = await request
      .post(readerApi.wxSignUp)
      .use(oauth)
      .use(noCache)
      .set(app)
      .set(KEY_UNION_ID, unionId)
      .send(c);

    return resp.body
  }

  async requestPwResetLetter(data: PwResetLetter, app: HeaderApp): Promise<boolean> {
    const resp = await request
      .post(readerApi.passwordResetLetter)
      .use(oauth)
      .use(noCache)
      .set(app)
      .send(data);

    return resp.noContent;
  }

  async verifyPwResetToken(token: string): Promise<EmailForm> {
    const resp = await request
      .get(readerApi.passwordResetToken(token))
      .use(oauth)
      .use(noCache)

    const body = resp.body;

    if (body.email) {
      return body;
    }

    throw new Error("incorrect api response");
  }

  async resetPassword(data: PasswordResetter): Promise<boolean> {
    const resp = await request
      .post(readerApi.resetPassword)
      .use(oauth)
      .use(noCache)
      .send(data);

    return resp.noContent;
  }

  async requestVerification(id: string, source: Pick<AccountFields, "sourceUrl">, app: HeaderApp): Promise<boolean> {
    const resp = await request
      .post(readerApi.requestVerification)
      .use(oauth)
      .use(noCache)
      .set(app)
      .set(KEY_USER_ID, id)
      .send(source);

    return resp.noContent;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const resp = await request
      .put(readerApi.verifyEmail(token))
      .use(oauth)
      .use(noCache);

    return resp.noContent;
  }

  async updateEmail(ftcId: string, data: EmailForm): Promise<boolean> {
    const resp = await request
      .patch(readerApi.email)
      .use(oauth)
      .use(noCache)
      .set(KEY_USER_ID, ftcId)
      .send(data);

    return resp.noContent;
  }

  async updatePassword(ftcId: string, data: PasswordUpdater): Promise<boolean> {
    const resp = await request
      .patch(readerApi.password)
      .use(oauth)
      .use(noCache)
      .set(KEY_USER_ID, ftcId)
      .send(data);

    return resp.noContent;
  }

  async link(account: Account, targetId: string): Promise<boolean> {
    const req = request
      .put(readerApi.linking)
      .use(oauth)
      .use(noCache)

    switch (account.loginMethod) {
      case "email":
        req.set(KEY_UNION_ID, targetId)
          .send({ userId: account.id });

        break;

      case "wechat":
        req.set(KEY_UNION_ID, account.unionId!)
          .send({ userId: targetId });
        break;
    }

    const resp = await req;

    return resp.noContent;
  }

  // anchor is only required when membership exists.
  async unlink(account: Account, anchor?: AccountKind): Promise<boolean> {
    const resp = await  request
      .delete(readerApi.linking)
      .use(oauth)
      .use(noCache)
      .set(KEY_USER_ID, account.id)
      .send({
        unionId: account.unionId,
        anchor: anchor || null,
      });

    return resp.noContent;
  }
}

export const accountService = new AccountService();
