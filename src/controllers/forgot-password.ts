import Router from "koa-router";
import render from "../util/render";
import {
    collectAppHeaders,
} from "./middleware";
import {
    HeaderApp,
} from "../models/header";
import { 
    entranceMap 
} from "../config/sitemap";
import { KeyDone } from "../pages/request-pw-reset-page";
import { EmailBuilder } from "../pages/request-pw-reset-page";
import { ResetPwBuilder } from "../pages/reset-password-page";
import { PasswordResetForm, EmailForm } from "../models/form-data";
import debug from "debug";
import { viper } from "../config/viper";

const log = debug("user:forgot-password");

const router = new Router();

/**
 * @description Show input box to let user to enter email.
 * 
 * ?key="invalid_token" | "letter_sent" | "pw_reset" for testing ui.
 */
router.get("/", async (ctx, next) => {
  // @ts-ignore
  let key: KeyDone | undefined = ctx.session.ok;

  // For testing.
  if (!viper.isProduction && !key) {
    key = ctx.query.key;
  }

  log("url: %s", ctx.url);
  log("originalUrl: %s", ctx.originalUrl);
  log("origin: %s", ctx.origin);
  log("href: %s", ctx.href);
  log("URL: %s", ctx.URL);
  

  const uiData = (new EmailBuilder()).build(key);
  Object.assign(ctx.state, uiData);
  
  return await next();
}, async (ctx, next) => {
  ctx.body = await render('forgot-password.html', ctx.state);

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
    const formData: EmailForm = ctx.request.body;
    const headers: HeaderApp = ctx.state.appHeaders;

    const emailBuilder = new EmailBuilder();

    const isValid = await emailBuilder.validate(formData);
    if (!isValid) {
      const uiData = emailBuilder.build();
      Object.assign(ctx.state, uiData);
      return await next();
    }

    const ok = await emailBuilder.requestLetter({
      sourceUrl: `${ctx.origin}${entranceMap.passwordReset}`,
      appHeaders: headers,
    });

    if (!ok) {
        const uiData = emailBuilder.build();

        Object.assign(ctx.state, uiData);

        return await next();
    }

    const key: KeyDone = "letter_sent";
    // @ts-ignore
    ctx.session.ok = key;

    ctx.redirect(ctx.path);
}, async (ctx, next) => {
  ctx.body = await render('forgot-password.html', ctx.state);
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

    const builder = new ResetPwBuilder();

    const redirectKey = await builder.verifyToken(token);

    if (redirectKey) {
      // @ts-ignore
      ctx.session.ok = redirectKey;
      return ctx.redirect(entranceMap.passwordReset);
    }

    Object.assign(ctx.state, builder.build());

    // In case the submit failure and this page need to be displayed again in POST.

    
    if (builder.email) {
      // @ts-ignore
      ctx.session.email = builder.email;
    }
    
    await next();
}, async (ctx, next) => {
    ctx.body = await render("forgot-password.html", ctx.state);
});

router.post("/:token", async (ctx, next) => {
    const token = ctx.params.token;

    const formData: PasswordResetForm | undefined = ctx.request.body.credentials;

    if (!formData) {
        throw new Error("form data not found");
    }

    const builder = new ResetPwBuilder();
    

    const isValid = await builder.validate(formData);
    if (!isValid) {
      // @ts-ignore
      builder.email = ctx.session.email;
      const uiData = builder.build();
      Object.assign(ctx.state, uiData);
      return await next();
    }

    const ok = await builder.resetPassword(token);
    if (!ok) {
      const uiData = builder.build();
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
    ctx.body = await render("forgot-password.html", ctx.state);
});

export default router.routes();
