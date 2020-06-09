import debug from "debug";
import Router from "koa-router";
import MobileDetect from "mobile-detect";
import render from "../util/render";
import {
  isProduction,
} from "../config/viper";
import {
  collectAppHeaders,
} from "./middleware";
import {
  Account,
} from "../models/account";
import {
  IHeaderApp,
} from "../models/header";
import {
  profileMap,
  accountMap,
} from "../config/sitemap";
import {
  WxCallbackBuilder
} from "../pages/wxlogin-page";
import {
  CallbackParams, OAuthSession, OAuthClient,
} from "../models/wx-oauth";
import { accountService } from "../repository/account";
import { CredentialBuilder } from "../pages/login-page";
import { Credentials } from "../models/request-data";
import { unixSeconds } from "../util/time";

const log = debug("user:login");

const router = new Router();

/**
 * @description Show login page.
 * Only show wechat login for desktop browsers.
 */
router.get("/", async (ctx, next) => {
  const uiData = (new CredentialBuilder()).build();

  Object.assign(ctx.state, uiData);

  const md = new MobileDetect(ctx.header["user-agent"]);
  ctx.state.isMobile = !!md.mobile();

  ctx.body = await render("login.html", ctx.state);
});

/**
 * @description Handle login form data.
 */
router.post("/", collectAppHeaders(), async (ctx, next) => {
  /**
   * @todo Keep session longer
   */
  let remeberMe: string = ctx.request.body.remeberMe;

  const formData: Credentials | undefined = ctx.request.body.credentials;

  if (!formData) {
    throw new Error("form data not found");
  }
  const builder = new CredentialBuilder();

  const isValid = await builder.validate(formData);
  if (!isValid) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);

    return await next();
  }

  const headers: IHeaderApp = ctx.state.appHeaders;
  const account = await builder.login(headers);

  if (!account) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);

    return await next();
  }

  // @ts-ignore
  ctx.session.user = account;

  ctx.cookies.set("USER_ID", account.id);
  ctx.cookies.set("USER_ID_FT", account.id);
  ctx.cookies.set("USER_NAME", account.userName || "");
  ctx.cookies.set("USER_NAME_FT", account.userName || "");
  ctx.cookies.set("paywall", account.membership.tier || "");
  ctx.cookies.set("paywall_expire", `${unixSeconds(account.membership.expireDate)}`);


  return ctx.redirect(profileMap.base);

}, async (ctx, next) => {
  ctx.body = await render("login.html", ctx.state);
});

/**
 * @description Handle wechat login request.
 * This will redirect user to wechat.
 * 
 * GET /login/wechat<?sandbox=true>
 * 
 * Wechat login API: https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
 * 
 * Implement the 1st step:
 * 第一步：请求CODE
 * 第三方使用网站应用授权登录前请注意已获取相应网页授权作用域（scope=snsapi_login），
 * 可以通过在PC端打开以下链接
 * 
 * ```
 * https://open.weixin.qq.com/connect/qrconnect?appid=<APPID>&redirect_uri=<REDIRECT_URI>&response_type=code&scope=<SCOPE>&state=<STATE>#wechat_redirect
 * ```
 * 
 * Request parameters:
 * 
 * `appId: string`. Required. Your app's unique identifier.
 * `redirect_url: string`. Required. Url-encoded callback url on your site.
 * `response_type: code`
 * `scope: snsapi_login`
 * `state: string` Opitonal but recommened. Returned as is.
 * 
 * Response:
 * 
 * * 用户允许授权后，将会重定向到redirect_uri的网址上，并且带上`code`和`state`参数
 * 
 * ```
 * redirect_uri?code=<CODE>&state=<STATE>
 * ```
 * 
 * * 若用户禁止授权，则重定向后不会带上code参数，仅会带上state参数
 * 
 * ```
 * redirect_uri?state=<STATE>
 * ```
 */
router.get("/wechat", async (ctx, next) => {
  const account: Account | undefined = ctx.state.user;
  const sandbox: string | undefined = ctx.request.query.sandbox

  const reqData = (new OAuthClient(account ? "link" : "login")).buildCodeRequest();

  // State that will be used later to validate callback query parameters.

  // @ts-ignore
  ctx.session.wx_oauth = reqData.session;

  // Redirect to wechat api.
  ctx.redirect(reqData.oauthUrl);
});

router.get("/wechat/test", collectAppHeaders(), async (ctx, next) => {
  if (isProduction) {
    ctx.status = 404;
    return;
  }

  const account = await accountService.fetchWxAccount("tvSxA7L6cgl8nwkrScm_yRzZoVTy");

  console.log(account);

  ctx.session.user = account;

  ctx.redirect(profileMap.base);
});

/**
 * @description Wechat OAuth callback for authorization_code.
 * Here we used subscription api as a transfer point
 * to deliver wechat OAuth code here.
 * If user accessed this page without login, then they
 * must be attempting to log in via wechat OAuth;
 * If user is accessing this page while already logged
 * in and log in method is not `wechat`, it indicates 
 * user is trying to link to wechat account;
 * If user already logged-in and login method is 
 * `wechat`, deny access.
 * 
 * GET /login/wechat/callback?code=xxx&state=xxx
 * 
 * We do not implment step 2 and step 3 of the OAuth flow here.
 * Rather, they are put on API and this app simply validate the callback and
 * delegate the code to API. After receiving the WxSession instance returned
 * from API, the login process completes.
 * 
 * 第二步：通过code获取access_token.
 * 
 * ```
 * https://api.weixin.qq.com/sns/oauth2/access_token?appid=<APPID>&secret=<SECRET>&code=<CODE>&grant_type=authorization_code
 * ```
 * 
 * Request parameters:
 * `appid: string`. Required. Your app's unique identifier.
 * `secret: string`. Required. AppSecret.
 * `code: string`. Required. The OAuth code aquired in the the 1st step.
 * `grant_type: authorization_code`.
 * 
 * Response:
 * 
 * ```json
 * {
 *  "access_token":"ACCESS_TOKEN",
 *  "expires_in":7200,
 *  "refresh_token":"REFRESH_TOKEN",
 *  "openid":"OPENID",
 *  "scope":"SCOPE",
 *  "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL"
 * }
 * ```
 * 
 * The 3rd step, 第三步：通过access_token调用接口, is implemented by API.
 */
router.get("/wechat/callback", collectAppHeaders(), async (ctx, next) => {
  const query: CallbackParams = ctx.request.query;

  // @ts-ignore
  const wxOAuthSess: OAuthSession | undefined = ctx.session.wx_oauth;
  if (isProduction) {
    // @ts-ignore
    delete ctx.session.wx_oauth;
  };

  const headers: IHeaderApp = ctx.state.appHeaders;
  const localAccount: Account | undefined = ctx.state.user;

  const builder = new WxCallbackBuilder(localAccount);
  const isValid = builder.validate(query, wxOAuthSess);

  if (!isValid) {
    const uiData = builder.buildUI();

    Object.assign(ctx.state, uiData);

    return await next();
  }

  const wxSession = await builder.getApiSession(headers);

  if (!wxSession) {
    const uiData = builder.buildUI();

    Object.assign(ctx.state, uiData);

    return await next();
  }

  if (!wxOAuthSess) {
    throw new Error("wechat oauth session not found");
  }

  // The wechat login is used for linking accounts.
  if (wxOAuthSess.usage == "link") {

    if (!localAccount || localAccount.loginMethod == "wechat") {
      ctx.status = 404;
      return;
    }

    // Save unionId to `ctx.session.uid`.

    // @ts-ignore
    ctx.session.uid = wxSession.unionId;
    return ctx.redirect(accountMap.linkMerging);
  }

  const wxAccount = await builder.getAccount(wxSession.unionId);

  // Show API request errors.
  if (!wxAccount) {
    const uiData = builder.buildUI();

    Object.assign(ctx.state, uiData);

    return await next();
  }

  // @ts-ignore
  ctx.session.user = wxAccount;

  ctx.redirect(profileMap.base);
}, async (ctx, next) => {
  ctx.body = await render("wx-oauth.html", ctx.state);
});

export default router.routes();
