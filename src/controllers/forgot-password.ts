import Router from "koa-router";
import render from "../util/render";
import {
    ITokenApiErrors,
    pwResetViewModel,
    IPwResetFormData,
} from "../viewmodels/pw-reset-viewmodel";
import {
    collectAppHeaders,
} from "./middleware";
import { 
    IAppHeader, 
    IEmail
} from "../models/reader";
import { 
    entranceMap 
} from "../config/sitemap";
import { KeyPwReset } from "../viewmodels/redirection";

const router = new Router();

/**
 * @description Show input box to let user to enter email.
 */
router.get("/", async (ctx, next) => {
    const key: KeyPwReset = ctx.session.ok;

    const uiData = pwResetViewModel.buildEmailUI(
        undefined,
        key,
    );

    Object.assign(ctx.state, uiData);

    return await next();
}, async (ctx, next) => {
    ctx.body = await render('forgot-password/enter-email.html', ctx.state);

    delete ctx.session.ok;
});

/**
 * @description Verify user's email and ask API to sent a password reset letter.
 * After letter sent successfully, redirect back
 * to the this page and show a message that email
 * is sent.
 */
router.post("/", collectAppHeaders(), async (ctx, next) => {
    const formData: IEmail = ctx.request.body;

    const headers: IAppHeader = ctx.state.appHeaders;

    const { success, formState, errResp } = await pwResetViewModel.requestLetter(formData, headers);

    if (!success) {
        const uiData = pwResetViewModel.buildEmailUI({ formState, errResp });

        Object.assign(ctx.state, uiData);
        ctx.body = await render('forgot-password/enter-email.html', ctx.state);

        return;
    }

    const key: KeyPwReset = "letter_sent";
    ctx.session.ok = key;

    ctx.redirect(ctx.path);
});

/**
 * @description Hanle user click of password reset link.
 * Extract the token from url and ask API to verify
 * whehter the token is valid.
 * If the token is invalid, redirect back to /password-reset
 * page and show error message that the token is invalid.
 * For other errors, just display the password reset form.
 */
router.get("/:token", async (ctx, next) => {
    const token: string = ctx.params.token;

    const { success, errResp } = await pwResetViewModel.verifyToken(token);

    if (errResp) {
        if (errResp.notFound) {
            const key: KeyPwReset = "invalid_token";
            ctx.session.ok = key;
            return ctx.redirect(entranceMap.passwordReset);

        }

        Object.assign(ctx.state, pwResetViewModel.buildPwResetUI(
            "",
            { errResp },
        ));

        return await next();
    }

    if (!success) {
        throw new Error("API response error");
    }

    Object.assign(ctx.state, pwResetViewModel.buildPwResetUI(success.email));

    // In case the submit failure and this page need to be displayed again in POST.
    ctx.session.email = success.email;

    await next();
}, async (ctx, next) => {
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
    const key: KeyPwReset = "pw_reset";
    ctx.session.ok = key;

    ctx.redirect(entranceMap.passwordReset);

    delete ctx.session.email;

}, async (ctx, next) => {
    ctx.body = await render("forgot-password/new-password.html", ctx.state);
});

export default router.routes();
