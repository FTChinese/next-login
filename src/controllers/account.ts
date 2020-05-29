import Router from "koa-router";
import render from "../util/render";
import {
  collectAppHeaders,
} from "./middleware";
import {
  Account,
  Credentials,
} from "../models/reader";
import {
  IHeaderApp,
} from "../models/header";
import {
  accountMap
} from "../config/sitemap";
import {
  KeyUpdated,
} from "../pages/redirection";
import {
  IPasswordsFormData, AccountPageBuilder,
} from "../pages/account-page";
import {
  linkViewModel, ILinkingFormData, IUnlinkFormData,
} from "../viewmodels/link-viewmodel";
import {
  ISignUpFormData,
} from "../pages/validator";
import {
  isProduction,
} from "../config/viper";
import { UpdateEmailBuilder } from "../pages/update-email";
import { UpdatePasswordBuilder } from "../pages/update-password";
import { EmailData } from "../models/form-data";

const router = new Router();

/**
 * @description Show user account data.
 * This is also the redirect target if user successfully update email, password;
 * or if a wechat-user signed up successfully.
 */
router.get("/", async (ctx, next) => {
  const account: Account = ctx.state.user;

  if (account.isWxOnly()) {
    return await next();
  }

  // @ts-ignore
  const key: KeyUpdated | undefined = ctx.session.ok;

  const builder = new AccountPageBuilder(account);

  await builder.refresh();

  const uiData = builder.build(key);

  Object.assign(ctx.state, uiData);

  // @ts-ignore
  ctx.session.user = builder.account;

  return await next();

}, async (ctx, next) => {
  ctx.body = await render("account/account.html", ctx.state);

  // @ts-ignore
  delete ctx.session.ok;
});

router.get("/email", async (ctx, next) => {
  const account: Account = ctx.state.user;

  if (account.isWxOnly()) {
    ctx.status = 404;
    return;
  }

  const builder = new UpdateEmailBuilder(account);
  const uiData = await builder.build();
  Object.assign(ctx.state, uiData);

  ctx.body = await render("profile/single-input.html", ctx.state);
});

router.post("/email", async (ctx, next) => {
  const account: Account = ctx.state.user;

  if (account.isWxOnly()) {
    ctx.status = 404;
    return;
  }

  const formData: EmailData = ctx.request.body;
  const builder = new UpdateEmailBuilder(account);

  const isValid = await builder.validate(formData);
  if (!isValid) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  const ok = await builder.update();
  if (!ok) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  const key: KeyUpdated = "saved";

  // @ts-ignore
  ctx.session.ok = key;
  // @ts-ignore
  ctx.session.user = builder.updatedAccount;

  return ctx.redirect(accountMap.base);

}, async (ctx, next) => {
  ctx.body = await render("profile/single-input.html", ctx.state);
});

router.get("/password", async (ctx, next) => {
  const account: Account = ctx.state.user;

  const uiData = (new UpdatePasswordBuilder(account)).build();

  Object.assign(ctx.state, uiData);

  ctx.body = await render("profile/single-input.html", ctx.state);
});

router.post("/password", async (ctx, next) => {
  const account: Account = ctx.state.user;

  if (account.isWxOnly()) {
    ctx.status = 404;
    return;
  }

  const formData: IPasswordsFormData = ctx.request.body;

  const builder = new UpdatePasswordBuilder(account);
  const isValid = await builder.validate(formData);
  if (!isValid) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  const ok = await builder.update();
  if (!ok) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  const key: KeyUpdated = "password_saved";

  // @ts-ignore
  ctx.session.ok = key;

  return ctx.redirect(accountMap.base);
}, async (ctx, next) => {
  ctx.body = await render("profile/single-input.html", ctx.state);
});

router.post("/request-verification", collectAppHeaders(), async (ctx, next) => {
  const account: Account = ctx.state.user;

  if (account.isWxOnly()) {
    ctx.status = 404;
    return;
  }

  const builder = new AccountPageBuilder(account);
  const ok = await builder.requestVerification(ctx.state.appHeaders);

  if (!ok) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  const key: KeyUpdated = "letter_sent";

  // @ts-ignore
  ctx.session.ok = key;

  return ctx.redirect(accountMap.base);
}, async (ctx, next) => {
  ctx.body = await render("layouts/content.html", ctx.state);
});

/**
 * @description Let a wechat-only account to enter email to check whether it has an ftc account.
 */
router.get("/link/email", async (ctx, next) => {
  const uiData = linkViewModel.buildEmailUI();

  Object.assign(ctx.state, uiData);

  ctx.body = await render("account/email-exists.html", ctx.state);
});

router.post("/link/email", async (ctx, next) => {
  const formData: EmailData = ctx.request.body;

  const { success, errForm, errResp } = await linkViewModel.checkEmail(formData);

  if (errForm || errResp) {
    const uiData = linkViewModel.buildEmailUI(
      formData,
      { errForm, errResp },
    );

    Object.assign(ctx.state, uiData);

    return await next();
  }

  // Save the email to session so that user
  // does not need to re-enter the email after redirect.

  // @ts-ignore
  ctx.session.email = formData.email.trim();

  if (success) {
    ctx.redirect(accountMap.linkFtcLogin);
  } else {
    ctx.redirect(accountMap.linkSignUp);
  }

  return;
}, async (ctx, next) => {
  ctx.body = await render("account/email-exists.html", ctx.state);
});

/**
 * @description If a wechat-user already has an ftc account, redirecto here and ask user to login.
 */
router.get("/link/login", async (ctx, next) => {
  // @ts-ignore
  const email = ctx.session.email;

  if (!email) {
    ctx.status = 404;
    return;
  }

  const uiData = linkViewModel.buildLoginUI({
    email,
    password: "",
  });

  Object.assign(ctx.state, uiData);

  ctx.body = await render("account/login.html", ctx.state);

  if (isProduction) {
    // @ts-ignore
    delete ctx.session.email;
  }
});

router.post("/link/login",
  collectAppHeaders(), async (ctx, next) => {
    const formData: Credentials | undefined = ctx.request.body.credentials;

    if (!formData) {
      throw new Error("form data not found");
    }

    const headers: IHeaderApp = ctx.state.appHeaders;

    const { success, errForm, errResp } = await linkViewModel.logIn(formData, headers)

    if (!success) {
      const uiData = linkViewModel.buildLoginUI(
        formData,
        { errForm, errResp },
      );

      Object.assign(ctx.state, uiData);

      return await next();
    }

    // Redirect user to merge account page.

    // @ts-ignore
    ctx.session.uid = success;
    ctx.redirect(accountMap.linkMerging);

  }, async (ctx, next) => {
    ctx.body = await render("account/login.html", ctx.state);
  });

/**
 * @description A wechat-only user create a new ftc account.
 */
router.get("/link/signup", async (ctx, next) => {
  // @ts-ignore
  const email = ctx.session.email;

  if (!email) {
    ctx.status = 404;
    return;
  }

  const uiData = linkViewModel.buildSignUpUI({
    email,
    password: "",
    confirmPassword: "",
  });

  Object.assign(ctx.state, uiData);

  ctx.body = await render("account/signup.html", ctx.state);

  if (isProduction) {
    // @ts-ignore
    delete ctx.session.email;
  }
});

/**
 * @description Create ftc account for wechat-only user.
 */
router.post("/link/signup", collectAppHeaders(), async (ctx, next) => {
  const formData: ISignUpFormData = ctx.request.body.credentials;

  if (!formData) {
    throw new Error("form data not found");
  }

  const headers: IHeaderApp = ctx.state.appHeaders;
  const account: Account = ctx.state.user;
  const { success, errForm, errResp } = await linkViewModel.signUp(formData, account, headers);

  if (!success) {
    const uiData = linkViewModel.buildSignUpUI(
      formData,
      { errForm, errResp },
    );

    Object.assign(ctx.state, uiData);

    return await next();
  }

  // If wechat user is signed up, redirect to
  // account page since signup process also links account.
  return ctx.redirect(accountMap.base);

}, async (ctx, next) => {
  ctx.body = await render("account/signup.html", ctx.state);
});

/**
 * @description Redirection target from `/login/callback`
 * or `/account/link/login`.
 * `ctx.session.uid: string` is required.
 */
router.get("/link/merge", async (ctx, next) => {
  const account: Account = ctx.state.user;

  // Passed from `/login/callback` or `/account/link/login`

  // @ts-ignore
  const targetId: string | undefined = ctx.session.uid;
  // Passed from POST error.

  // @ts-ignore
  const errMsg: string | undefined = ctx.session.errMsg;

  if (!targetId) {
    ctx.status = 404;
    return;
  }

  const accounts = await linkViewModel.fetchAccountToLink(account, targetId);

  const uiData = linkViewModel.buildMergeUI(accounts, { targetId }, errMsg);

  Object.assign(ctx.state, uiData);

  ctx.body = await render("account/merge.html", ctx.state);

  // @ts-ignore
  delete ctx.session.uid;
  // @ts-ignore
  delete ctx.session.errMsg;
});

router.post("/link/merge", async (ctx, next) => {
  const account: Account = ctx.state.user;

  if (account.isLinked()) {
    ctx.status = 404;
    return;
  }

  const formData: ILinkingFormData = ctx.request.body;

  const { success, errForm, errResp } = await linkViewModel.mergeAccount(
    account,
    formData,
  );

  if (!success) {
    // Pass error message in redirection.
    if (errForm) {
      // @ts-ignore
      ctx.session.errMsg = errForm.targetId;
    } else if (errResp) {
      // @ts-ignore
      ctx.session.errMsg = errResp.message;
    }
    // @ts-ignore
    ctx.session.uid = formData.targetId;
    return ctx.redirect(ctx.path);
  }

  ctx.redirect(accountMap.base);
});

router.get("/unlink", async (ctx, next) => {
  const account: Account = ctx.state.user;

  if (!account.isLinked()) {
    ctx.status = 404;
    return;
  }

  Object.assign(ctx.state, linkViewModel.buildUnlinkUI(account));

  ctx.body = await render("account/unlink.html", ctx.state);
});

router.post("/unlink", async (ctx, next) => {
  const account: Account = ctx.state.user;

  if (!account.isLinked()) {
    ctx.status = 404;
    return;
  }

  const formData: IUnlinkFormData = ctx.request.body;

  const { success, formState, errResp } = await linkViewModel.sever(account, formData);

  if (!success) {
    Object.assign(ctx.state, linkViewModel.buildUnlinkUI(
      account,
      { formState, errResp },
    ));

    return await next();
  }

  ctx.redirect(accountMap.base);

}, async (ctx, next) => {
  ctx.body = await render("account/unlink.html", ctx.state);
});

export default router.routes();
