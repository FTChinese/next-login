import Router from "koa-router";
import MobileDetect from "mobile-detect";
import render from "../util/render";
import {
    isProduction,
} from "../config/viper";
import {
    loginViewModel,
} from "../viewmodels/login-viewmodel";
import {
    collectAppHeaders,
} from "./middleware";
import { 
    ICredentials, 
    IAppHeader,
    Account,
} from "../models/reader";
import { 
    profileMap,
    accountMap,
} from "../config/sitemap";
import { 
    wxLoginViewModel 
} from "../viewmodels/wxlogin-viewmodel";
import { 
    ICallbackParams, IOAuthSession, 
} from "../models/wx-oauth";
import { accountRepo } from "../repository/account";
import { 
    oauthServer,
    IOAuthSession as IFtcOAuthSession,
 } from "../models/ftc-oauth";
import { toBoolean } from "../util/converter";

const router = new Router();

/**
 * @description Show login page.
 * Only show wechat login for desktop browsers.
 */
router.get("/", async (ctx, next) => {
    const uiData = loginViewModel.buildUI();

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

    const formData: ICredentials | undefined = ctx.request.body.credentials;

    if (!formData) {
        throw new Error("form data not found");
    }

    const headers: IAppHeader = ctx.state.appHeaders;
    const { success, errForm, errResp } = await loginViewModel.logIn(formData, headers);

    if (!success) {
        const uiData = loginViewModel.buildUI(formData, { errForm, errResp });

        Object.assign(ctx.state, uiData);

        return await next();
    }

    ctx.session.user = success;
    return ctx.redirect(profileMap.base);
    
}, async (ctx, next) => {
    ctx.body = await render("login.html", ctx.state);
});

/**
 * @description Handle wechat login request.
 * This will redirect user to wechat.
 * 
 * GET /login/wechat<?sandbox=true>
 */
router.get("/wechat", async (ctx, next) => {
    const account: Account | undefined = ctx.session.user;
    const sandbox: string | undefined = ctx.request.query.sandbox

    const data = wxLoginViewModel.codeRequest(
        account ? "link" : "login",
        toBoolean(sandbox),
    );

    // State that will be used later to validate callback query parameters.
    ctx.session.wx_oauth = data.session;

    // Redirect to wechat api.
    ctx.redirect(data.redirectUrl);
});

router.get("/wechat/test", collectAppHeaders(), async (ctx, next) => {
    if (isProduction) {
        ctx.status = 404;
        return;
    }

    const account = await accountRepo.fetchWxAccount("tvSxA7L6cgl8nwkrScm_yRzZoVTy");

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
 * user is trying to bind to wechat account;
 * If user already logged-in and login method is 
 * `wechat`, deny access.
 * 
 * GET /login/wechat/callback?code=xxx&state=xxx
 */
router.get("/wechat/callback", collectAppHeaders(), async(ctx, next) => {
    const query: ICallbackParams = ctx.request.query;

    const wxOAuthSess: IOAuthSession | undefined = ctx.session.wx_oauth;
    if (isProduction) {
        delete ctx.session.wx_oauth;
    };

    const headers: IAppHeader = ctx.state.appHeaders;
    const localAccount: Account | undefined = ctx.session.user;

    const { success, errQuery, errResp } = await wxLoginViewModel.getApiSession(query, headers, wxOAuthSess);

    if (!success) {
        const uiData = wxLoginViewModel.buildUI(
            { errQuery, errResp},
            localAccount,
        );

        Object.assign(ctx.state, uiData);

        return await next();
    }

    if (!wxOAuthSess) {
        throw new Error("wechat oauth session not found");
    }

    if (wxOAuthSess.usage == "link") {
        
        if (!localAccount || localAccount.loginMethod == "wechat") {
            ctx.status = 404;
            return;
        }

        // Save unionId to `ctx.session.uid`.
        ctx.session.uid = success.unionId;
        return ctx.redirect(accountMap.linkMerging);
    }

    const result = await wxLoginViewModel.getAccount(success);
    
    // Show API request errors.
    if (!result.success) {
        const uiData = wxLoginViewModel.buildUI(
            { errResp },
            localAccount,
        );

        Object.assign(ctx.state, uiData);

        return await next();
    }

    ctx.session.user = result.success;

    // This indicates user is trying to login to ftacademy, so redirect user to OAuth page.
    // Added by /authorize
    if (ctx.session.oauth) {
        const oauthSession: IFtcOAuthSession = ctx.session.oauth;

        ctx.redirect(oauthServer.buildAuthorizeUrl(oauthSession));

        delete ctx.session.oauth;
        return;
    }

    ctx.redirect(profileMap.base);
}, async (ctx, next) => {
    ctx.body = await render("wx-oauth.html", ctx.state);
});

export default router.routes();
