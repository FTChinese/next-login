import Router from "koa-router";
import render from "../util/render";
import {
    collectAppHeaders,
} from "./middleware";
import { 
    EmailData
} from "../models/reader";
import {
    IHeaderApp,
} from "../models/header";
import { 
    entranceMap 
} from "../config/sitemap";
import { RequestPwResetPage, KeyDone } from "../pages/request-pw-reset";
import { EmailBuilder } from "../pages/request-pw-reset";
import { ResetPwBuilder, ResetPasswordPage, PwResetData } from "../pages/reset-password";

const router = new Router();

/**
 * @description Show input box to let user to enter email.
 */
router.get("/", async (ctx, next) => {
    // @ts-ignore
    const key: KeyPwReset = ctx.session.ok;

    if (key) {
      const uiData = RequestPwResetPage.afterRedirect(key);
      Object.assign(ctx.state, uiData);
    } else {
      const uiData = new RequestPwResetPage(EmailBuilder.default());
      Object.assign(ctx.state, uiData);
    }
    
    return await next();
}, async (ctx, next) => {
    ctx.body = await render('forgot-password/enter-email.html', ctx.state);

    // @ts-ignore
    delete ctx.session.ok;
});

/**
 * @description Verify user's email and ask API to sent a password reset letter.
 * After letter sent successfully, redirect back
 * to the this page and show a message that email
 * is sent.
 */
router.post("/", collectAppHeaders(), async (ctx, next) => {
    const formData: EmailData = ctx.request.body;

    const headers: IHeaderApp = ctx.state.appHeaders;

    const emailBuilder = new EmailBuilder(formData);
    const isValid = await emailBuilder.validate();
    if (!isValid) {
      const uiData = new RequestPwResetPage(emailBuilder);
      Object.assign(ctx.state, uiData);
      return await next();
    }

    const ok = await emailBuilder.requestLetter(headers);

    if (!ok) {
        const uiData = new RequestPwResetPage(emailBuilder);

        Object.assign(ctx.state, uiData);

        return await next();
    }

    const key: KeyDone = "letter_sent";
    // @ts-ignore
    ctx.session.ok = key;

    ctx.redirect(ctx.path);
}, async (ctx, next) => {
  ctx.body = await render('forgot-password/enter-email.html', ctx.state);
});

/**
 * @description Handle user click of password reset link.
 * Extract the token from url and ask API to verify
 * whehter the token is valid.
 * If the token is invalid, redirect back to /password-reset
 * page and show error message that the token is invalid.
 * For other errors, just display the password reset form.
 */
router.get("/:token", async (ctx, next) => {
    const token: string = ctx.params.token;

    const builder = ResetPwBuilder.default();

    const apiErr = await builder.verifyToken(token);

    if (apiErr && apiErr.notFound) {
      const key: KeyDone = "invalid_token";

      // @ts-ignore
      ctx.session.ok = key;
      return ctx.redirect(entranceMap.passwordReset);
    }

    Object.assign(ctx.state, new ResetPasswordPage(builder));

    // In case the submit failure and this page need to be displayed again in POST.

    // @ts-ignore
    ctx.session.email = success.email;

    await next();
}, async (ctx, next) => {
    ctx.body = await render("forgot-password/new-password.html", ctx.state);
});

router.post("/:token", async (ctx, next) => {
    const token = ctx.params.token;

    const formData: PwResetData | undefined = ctx.request.body.credentials;

    if (!formData) {
        throw new Error("form data not found");
    }

    const builder = new ResetPwBuilder(formData);
    // @ts-ignore
    builder.email = ctx.session.email;

    const isValid = await builder.validate();
    if (!isValid) {
      
      const uiData = new ResetPasswordPage(builder);
      Object.assign(ctx.state, uiData);
      return await next();
    }

    const ok = await builder.resetPassword(token);
    if (!ok) {
      const uiData = new ResetPasswordPage(builder);
      Object.assign(ctx.state, uiData);
      return await next();
    }

    // Redirect.
    const key: KeyDone = "pw_reset";
    // @ts-ignore
    ctx.session.ok = key;

    ctx.redirect(entranceMap.passwordReset);

    // @ts-ignore
    delete ctx.session.email;

}, async (ctx, next) => {
    ctx.body = await render("forgot-password/new-password.html", ctx.state);
});

export default router.routes();
