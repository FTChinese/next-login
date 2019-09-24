import Router from "koa-router";
import MobileDetect from "mobile-detect";
import render from "../util/render";
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
    const { success, errForm, errApi } = await loginViewModel.logIn(formData, headers);

    if (!success) {
        const uiData = loginViewModel.buildUI(formData, { errForm, errApi });

        Object.assign(ctx.state, uiData);

        return await next();
    }

    return ctx.redirect(profileMap.base);
    
}, async (ctx, next) => {
    ctx.body = await render("login.html", ctx.state);
});

export default router.routes();
