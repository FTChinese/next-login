import Router from "koa-router";
import render from "../util/render";
import {
    signUpViewModel,
} from "../viewmodels/signup-viewmodel";
import {
    collectAppHeaders,
} from "./middleware";
import {
    IHeaderApp,
} from "../models/header";
import {
    ISignUpFormData,
} from "../viewmodels/validator";
import { 
    profileMap 
} from "../config/sitemap";
import { IOAuthSession, oauthServer } from "../models/ftc-oauth";

const router = new Router();

/**
 * @description Show signup page.
 */
router.get("/", async (ctx, next) => {
    const uiData = signUpViewModel.buildUI();

    Object.assign(ctx.state, uiData);

    ctx.body = await render("signup.html", ctx.state);
});

/**
 * @description Handle signup data.
 */
router.post("/", collectAppHeaders(), async (ctx, next) => {
    const formData: ISignUpFormData | undefined = ctx.request.body.credentials;

    if (!formData) {
        throw new Error("form data not found");
    }

    const headers: IHeaderApp = ctx.state.appHeaders;

    const { success, errForm, errResp } = await signUpViewModel.signUp(formData, headers);

    if (!success) {
        const uiData = signUpViewModel.buildUI(formData, { errForm, errResp });

        Object.assign(ctx.state, uiData);

        return await next();
    }

    ctx.session.user = success;

    if (ctx.session.oauth) {
        const oauthSession: IOAuthSession = ctx.session.oauth;

        ctx.redirect(oauthServer.buildAuthorizeUrl(oauthSession));

        delete ctx.session.oauth;
        
        return;
    }
    return ctx.redirect(profileMap.base);

}, async (ctx, next) => {
    ctx.body = await render('signup.html', ctx.state);
});

export default router.routes();
