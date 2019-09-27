import Router from "koa-router";
import MobileDetect from "mobile-detect";
import render from "../util/render";
import {
    ITokenApiErrors,
    pwResetViewModel,
    IPwResetFormData,
} from "../viewmodels/pw-reset-viewmodel";
import {
    ActionDoneKey,
} from "../viewmodels/ui";
import {
    appHeader,
} from "./middleware";
import { 
    IAppHeader, 
    IEmail
} from "../models/reader";
import { 
    entranceMap 
} from "../config/sitemap";


const router = new Router();

router.get("/", async (ctx, next) => {
    const key: ActionDoneKey = ctx.session.ok;

    if (key) {
        const uiData = pwResetViewModel.buildSuccessUI(key);

        Object.assign(ctx.state, uiData);

        return await next();
    }

    // Handle invalid token.
    if (ctx.session.errors) {
        const errors: ITokenApiErrors = ctx.session.errors;

        const uiData = pwResetViewModel.buildInvalidTokenUI(errors);

        Object.assign(ctx.state, uiData);

        return await next();
    }

    const uiData = pwResetViewModel.buildEmailUI();

    Object.assign(ctx.state, uiData);

    return await next();
}, async (ctx, next) => {
    ctx.body = await render('forgot-password/enter-email.html', ctx.state);

    delete ctx.session.ok;
    delete ctx.session.errors;

});

router.post("/", appHeader(),async (ctx, next) => {
    const formData: IEmail = ctx.request.body;

    const headers: IAppHeader = ctx.state.appHeaders;

    const { success, errForm, errApi } = await pwResetViewModel.requestLetter(formData, headers);

    if (!success) {
        const uiData = pwResetViewModel.buildEmailUI(formData, { errForm, errApi });

        Object.assign(ctx.state, uiData);
        ctx.body = await render('forgot-password/enter-email.html', ctx.state);

        return;
    }

    const key: ActionDoneKey = "letter_sent";
    ctx.session.ok = key;

    ctx.redirect(ctx.path);
});

router.get("/:token", async (ctx, next) => {
    const token: string = ctx.params.token;

    const { success, errResp } = await pwResetViewModel.verifyToken(token);

    if (errResp) {
        const errors: ITokenApiErrors = {};

        if (errResp.notFound) {
            errors.invalid = true;
        } else {
            errors.message = errResp.message;
        }

        ctx.session.errors = errors;
        return ctx.redirect(entranceMap.passwordReset);
    }

    if (!success) {
        throw new Error("API response error");
    }

    const uiData = pwResetViewModel.buildPwResetUI(success.email);

    Object.assign(ctx.state, uiData);

    // In case the submit failure and this page need to be displayed again in POST.
    ctx.session.email = success.email;

    ctx.body = await render("forgot-password/new-password.html", ctx.state);
});

router.post("/:token", async (ctx, next) => {
    const token = ctx.params.token;

    const formData: IPwResetFormData | undefined = ctx.request.body.credentials;

    if (!formData) {
        throw new Error("form data not found");
    }

    const { success, errForm, errResp } = await pwResetViewModel.resetPassword(formData, token);

    if (!success) {
        const email: string = ctx.session.email;

        const uiData = pwResetViewModel.buildPwResetUI(email, { errForm, errResp });

        Object.assign(ctx.state, uiData);

        return await next();
    }

    // Redirect.
    const key: ActionDoneKey = "password_reset";
    ctx.session.ok = key;

    ctx.redirect(entranceMap.passwordReset);

    delete ctx.session.email;

}, async (ctx, next) => {
    ctx.body = await render("forgot-password/new-password.html", ctx.state);
});

export default router.routes();
