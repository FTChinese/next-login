import { URL, URLSearchParams } from "url";
import Chance from "chance";
import { DateTime } from "luxon";
import debug from "debug";
import { Dictionary } from "./data-types";
import { IWxApp, viper } from "../config/viper";
import { subsApi } from "../config/api";
import { unixNow } from "../util/time";
import { pool } from "../util/random";

const chance = new Chance();
const log = debug("user:wx-oauth");

// The purpose of initiating wechat
// oauth workflow.
// Since Wechat OAuth redirect to the same URL, we need to distinguish
// between wheter the authorization attempt is login or link accounts.
export type WxOAuthUsage = "login" | "link";

/**
 * @description CodeRequestParams defines the data struture used to
 * build query paramter to request an OAuth code.
 */
interface CodeRequestParams extends Dictionary<string> {
  appid: string; // Your app's unique identifier
  redirect_uri: string; // Url-encoded callback url on your site
  response_type: "code";
  scope: "snsapi_login";
  state: string;
}

/**
 * @description Client-side session data.
 * When redirecting user to Wechat login page, we need to create
 * the `state` parameter and validate it after redirection.
 * The `state` and its creation time is stored in session so that
 * we can retrieve to validate the redirected parameters.
 */
export interface OAuthSession {
  state: string;
  created: number;
  usage: WxOAuthUsage;
}

/**
 * @description CodeRequest contains the data to request an OAuth code.
 */
interface CodeRequest {
  session: OAuthSession; // The session data should be persisted on client so that later we could use it to verify query parameter after OAuth redirection.
  oauthUrl: string; // The complete URL to go to request OAuth code.
}

/**
 * @description CallbackParams is the query parameter
 * in OAuth redirect url.
 */
export interface CallbackParams {
  code?: string; // Won't exist if user denied authorization.
  state?: string;
}

/**
 * @description `OAuthClient` is used to create an OAuth code request to Wechat API.
 */
export class OAuthClient {
  private app: IWxApp = viper.getConfig().wxapp.web_oauth;
  private baseUrl = new URL("https://open.weixin.qq.com/connect/qrconnect");
  private state = chance.string({
    pool,
    length: 12,
  });

  constructor(readonly usage: WxOAuthUsage) {
    this.baseUrl.hash = "wechat_redirect";
  }

  buildCodeRequest(): CodeRequest {
    return {
      session: {
        state: chance.string({
          pool,
          length: 12,
        }),
        created: unixNow(),
        usage: this.usage,
      },
      oauthUrl: this.buildCodeUrl(),
    };
  }

  /**
   * @description Create the url to request OAuth code.
   * `sandbox` determines the callback url to use.
   */
  private buildCodeUrl(): string {
    const params: CodeRequestParams = {
      appid: this.app.app_id,
      redirect_uri: subsApi.wxRedirect(),
      response_type: "code",
      scope: "snsapi_login",
      state: this.state,
    };

    this.baseUrl.search = new URLSearchParams(params).toString();

    return this.baseUrl.href;
  }
}

/**
 * @description WxSession represents a Wechat user's login session.
 * After the step 1 of Wechat OAuth, as described on
 * https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html,
 * finished, this app asks the API to perform the step 2 and step 3 of
 * of the OAuth workflow, and the API returns a WxSession.
 * The client could then use WxSession.id to ask API to refresh its access token,
 * and use unionId to get a unified FTC account data.
 */
export interface WxSession {
  id: string;
  unionId: string;
  createdAt: string;
}

function isWxSessionExpired(s: WxSession): boolean {
  const created = DateTime.fromISO(s.createdAt);
  const expireAt = created.plus({ days: 30 });

  return expireAt > DateTime.utc();
}
