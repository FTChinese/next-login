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
    appHeader,
} from "./middleware";
import { 
    ICredentials, IAppHeader 
} from "../models/reader";
import { 
    profileMap 
} from "../config/sitemap";
import { 
    wxLoginViewModel 
} from "../viewmodels/wxlogin-viewmodel";
import { 
    ICallbackParams, 
    ISessionState 
} from "../models/wx-oauth";
import { accountRepo } from "../repository/account";

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
router.post("/", appHeader(), async (ctx, next) => {
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
 * GET /login/wechat
 */
router.get("/wechat", async (ctx, next) => {
    const data = wxLoginViewModel.codeRequest();

    // State that will be used later to validate callback query parameters.
    ctx.session.state = data.state;

    // Redirect to wechat api.
    ctx.redirect(data.redirectUrl);
});

router.get("/wechat/test", appHeader(), async (ctx, next) => {
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
router.get("/wechat/callback", appHeader(), async(ctx, next) => {
    const query: ICallbackParams = ctx.request.query;

    const sessState: ISessionState | undefined = ctx.session.state;

    const failure = wxLoginViewModel.validateCallback(query, sessState);

    if (failure) {
        return await next();
    }

    const headers: IAppHeader = ctx.state.appHeaders;
    const account = await wxLoginViewModel.logIn(query.code!, headers);
    
    ctx.session.user = account;

    ctx.redirect(profileMap.base);
}, async (ctx, next) => {
    ctx.body = await render("wx-oauth.html", ctx.state);

    if (isProduction) {
        delete ctx.session.state;
    };
});

export default router.routes();
