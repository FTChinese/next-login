import Router from "koa-router";
import render from "../util/render";
import { collectAppHeaders } from "./middleware";
import { Account, isAccountWxOnly, isAccountLinked } from "../models/account";
import { HeaderApp } from "../models/header";
import { accountMap } from "../config/sitemap";
import { KeyUpdated } from "../pages/redirection";
import { AccountPageBuilder } from "../pages/account-page";
import { viper } from "../config/viper";
import { UpdateEmailBuilder } from "../pages/update-email";
import { UpdatePasswordBuilder } from "../pages/update-password";
import { EmailData, PasswordsFormData, SignUpForm, LinkingFormData, UnlinkFormData } from "../models/form-data";
import { LinkEmailPageBuilder, LinkLoginPageBuilder, WxSignUpPageBuilder, MergePageBuilder } from "../pages/link-page";
import { accountService } from "../repository/account";
import { UnlinkPageBuilder } from "../pages/unlink-page";
import { Credentials } from "../models/request-data";

const router = new Router();

/**
 * @description Show user account data.
 * This is also the redirect target if user successfully update email, password;
 * or if a wechat-user signed up successfully.
 */
router.get(
  "/",
  async (ctx, next) => {
    const account: Account = ctx.state.user;

    // @ts-ignore
    const key: KeyUpdated | undefined = ctx.session.ok;

    const builder = new AccountPageBuilder(account);

    await builder.refresh();

    const uiData = builder.build(key);

    Object.assign(ctx.state, uiData);

    // @ts-ignore
    ctx.session.user = builder.account;

    return await next();
  },
  async (ctx, next) => {
    ctx.body = await render("account.html", ctx.state);

    // @ts-ignore
    delete ctx.session.ok;
  }
);

/** Show update email page */
router.get("/email", async (ctx, next) => {
  const account: Account = ctx.state.user;

  if (isAccountWxOnly(account)) {
    ctx.status = 404;
    return;
  }

  const builder = new UpdateEmailBuilder(account);
  const uiData = await builder.build();
  Object.assign(ctx.state, uiData);

  ctx.body = await render("single-input.html", ctx.state);
});

/** Update email */
router.post(
  "/email",
  async (ctx, next) => {
    const account: Account = ctx.state.user;

    if (isAccountWxOnly(account)) {
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
  },
  async (ctx, next) => {
    ctx.body = await render("single-input.html", ctx.state);
  }
);

router.get("/password", async (ctx, next) => {
  const account: Account = ctx.state.user;

  const uiData = new UpdatePasswordBuilder(account).build();

  Object.assign(ctx.state, uiData);

  ctx.body = await render("single-input.html", ctx.state);
});

router.post(
  "/password",
  async (ctx, next) => {
    const account: Account = ctx.state.user;

    if (isAccountWxOnly(account)) {
      ctx.status = 404;
      return;
    }

    const formData: PasswordsFormData = ctx.request.body;

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
  },
  async (ctx, next) => {
    ctx.body = await render("single-input.html", ctx.state);
  }
);

/** Requrest email verification letter */
router.post(
  "/request-verification",
  collectAppHeaders(),
  async (ctx, next) => {
    const account: Account = ctx.state.user;

    if (isAccountWxOnly(account)) {
      ctx.status = 404;
      return;
    }

    const sourceUrl = ctx.origin + "/verify/email";

    const builder = new AccountPageBuilder(account);
    const ok = await builder.requestVerification(
      {
        sourceUrl,
      }, 
      ctx.state.appHeaders);

    if (!ok) {
      const uiData = builder.build();
      Object.assign(ctx.state, uiData);
      return await next();
    }

    const key: KeyUpdated = "letter_sent";

    // @ts-ignore
    ctx.session.ok = key;

    return ctx.redirect(accountMap.base);
  },
  async (ctx, next) => {
    ctx.body = await render("layouts/content.html", ctx.state);
  }
);

/**
 * @description Let a wechat-only account to enter email to check whether it has an ftc account.
 */
router.get("/link/email", async (ctx, next) => {
  const builder = new LinkEmailPageBuilder();

  const uiData = builder.build();

  Object.assign(ctx.state, uiData);

  ctx.body = await render("link/base-layout.html", ctx.state);
});

router.post(
  "/link/email",
  async (ctx, next) => {
    const formData: EmailData = ctx.request.body;

    const builder = new LinkEmailPageBuilder();

    const isValid = await builder.validate(formData);
    if (!isValid) {
      const uiDate = builder.build();

      Object.assign(ctx.state, uiDate);

      return await next();
    }

    const { found, errored } = await builder.exists();
    if (errored) {
      const uiData = builder.build();
      Object.assign(ctx.state, uiData);

      return await next();
    }

    // Save the email to session so that user
    // does not need to re-enter the email after redirect.

    // @ts-ignore
    ctx.session.email = builder.formData?.email;

    if (found) {
      ctx.redirect(accountMap.linkFtcLogin);
    } else {
      ctx.redirect(accountMap.linkSignUp);
    }

    return;
  },
  async (ctx, next) => {
    ctx.body = await render("link/base-layout.html", ctx.state);
  }
);

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

  const builder = new LinkLoginPageBuilder(email);

  const uiData = builder.build();

  Object.assign(ctx.state, uiData);

  ctx.body = await render("link/base-layout.html", ctx.state);

  if (viper.isProduction) {
    // @ts-ignore
    delete ctx.session.email;
  }
});

/** A wechat logged in user link to an existing ftc account. */
router.post(
  "/link/login",
  collectAppHeaders(),
  async (ctx, next) => {
    const formData: Credentials | undefined = ctx.request.body.credentials;

    if (!formData) {
      throw new Error("form data not found");
    }

    const headers: HeaderApp = ctx.state.appHeaders;

    const builder = new LinkLoginPageBuilder();

    const isValid = await builder.validate(formData);
    if (!isValid) {
      const uiData = builder.build();
      Object.assign(ctx.state, uiData);
      return await next();
    }

    const ftcAccount = await builder.login(headers);
    if (!ftcAccount) {
      const uiData = builder.build();
      Object.assign(ctx.state, uiData);
      return await next();
    }

    // Redirect user to merge account page.

    // @ts-ignore
    ctx.session.uid = ftcAccount.id;
    return ctx.redirect(accountMap.linkMerging);
  },
  async (ctx, next) => {
    ctx.body = await render("link/base-layout.html", ctx.state);
  }
);

/** Show page to let a wechat logged in user to create a new ftc account*/
router.get("/link/signup", async (ctx, next) => {
  // @ts-ignore
  const email = ctx.session.email;

  if (!email) {
    ctx.status = 404;
    return;
  }

  const builder = new WxSignUpPageBuilder(email);

  const uiData =  builder.build();
  Object.assign(ctx.state, uiData);

  ctx.body = await render("link/base-layout.html", ctx.state);

  if (viper.isProduction) {
    // @ts-ignore
    delete ctx.session.email;
  }
});

/**
 * @description Create ftc account for wechat-only user.
 */
router.post(
  "/link/signup",
  collectAppHeaders(),
  async (ctx, next) => {
    const formData: SignUpForm = ctx.request.body.credentials;

    if (!formData) {
      throw new Error("form data not found");
    }

    const headers: HeaderApp = ctx.state.appHeaders;
    const account: Account = ctx.state.user;
    if (!account.unionId) {
      throw new Error("You are not logged in with Wechat account");
    }

    const builder = new WxSignUpPageBuilder();
    const isValid = await builder.validate(formData);
    if (!isValid) {
      const uiData = builder.build();
      Object.assign(ctx.state, uiData);
      return await next();
    }

    const newAccount = await builder.create(
      account.unionId,
      headers,
    );

    if (!newAccount) {
      const uiData = builder.build();
      Object.assign(ctx.state, uiData);
      return await next();
    }

    // @ts-ignore
    ctx.session.user = newAccount;

    // If wechat user is signed up, redirect to
    // account page since signup process also links account.
    return ctx.redirect(accountMap.base);
  },
  async (ctx, next) => {
    ctx.body = await render("link/base-layout.html", ctx.state);
  }
);

/**
 * @description Redirection target from `/login/callback`
 * or `/account/link/login`.
 * `ctx.session.uid: string` is required.
 */
router.get("/link/merge", async (ctx, next) => {
  const account: Account = ctx.state.user;

  // Passed from POST after successfully linked.
  //@ts-ignore
  const linked: boolean = ctx.session.linked || false;

  const builder = new MergePageBuilder(linked);

  // Show link sucessfuly message.
  if (linked) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);

    return await next();
  }

  // @ts-ignore
  const targetId: string | undefined = ctx.session.uid;

  if (!targetId) {
    ctx.status = 404;
    return;
  }

  const ok = await builder.fetchAccountToLink(account, targetId);
  if (!ok) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  const isValid = builder.validate();
  if (!isValid) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  const uiData = builder.build();
  Object.assign(ctx.state, uiData);

  return await next();
}, async (ctx, next) => {
  ctx.body = await render("link/merge.html", ctx.state);
  // @ts-ignore
  delete ctx.session.linked;
});

/**
 * Send request to link accounts.
 */
router.post("/link/merge", async (ctx, next) => {
  const account: Account = ctx.state.user;

  if (isAccountLinked(account)) {
    ctx.status = 404;
    return;
  }

  /** @todo: validate form data. */
  const formData: LinkingFormData = ctx.request.body;

  const builder = new MergePageBuilder();

  const ok = await builder.merge(account, formData)
  if (!ok) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  // @ts-ignore
  delete ctx.session.uid;
  // @ts-ignore
  ctx.session.linked = true;

  // @ts-ignore
  ctx.session.user = await accountService.refreshAccount(account);

  return ctx.redirect(accountMap.linkMerging);

}, async (ctx, next) => {
  ctx.body = await render("link/merge.html", ctx.state);
});

/** Show unlink page */
router.get("/unlink", async (ctx, next) => {
  const account: Account = ctx.state.user;

  if (!isAccountLinked(account)) {
    ctx.status = 404;
    return;
  }

  // @ts-ignore
  const unlinked: boolean = ctx.session.unlinked || false;

  const builder = new UnlinkPageBuilder(account, unlinked);

  const uiData = builder.build();
  Object.assign(ctx.state, uiData);
  return await next();
  
}, async (ctx, next) => {
  ctx.body = await render("link/unlink.html", ctx.state);

  // @ts-ignore
  delete ctx.session.unlinked;
});

/** Perform unlink */
router.post(
  "/unlink",
  async (ctx, next) => {
    const account: Account = ctx.state.user;

    if (!isAccountLinked(account)) {
      ctx.status = 404;
      return;
    }

    const formData: UnlinkFormData = ctx.request.body;

    const builder = new UnlinkPageBuilder(account);

    const isValid = builder.validate(formData);
    if (!isValid) {
      const uiData = builder.build();
      Object.assign(ctx.state, uiData);
      return await next();
    }

    const ok = await builder.unlink();
    if (!ok) {
      const uiData = builder.build();
      Object.assign(ctx.state, uiData);
      return await next();
    }

    // @ts-ignore
    ctx.session.unlinked = true;
    ctx.redirect(accountMap.unlinkWx);
  },
  async (ctx, next) => {
    ctx.body = await render("link/unlink.html", ctx.state);
  }
);

export default router.routes();
