import debug from "debug";
import Router from "koa-router";
import render from "../util/render";
import {
  Account,
  Address,
  isAccountWxOnly,
} from "../models/account";
import { ProfilePageBuilder } from "../pages/profile-list";
import { profileMap } from "../config/sitemap";
import { PersonalInfoBuilder } from "../pages/update-personal-info";
import { DisplayNameBuilder } from "../pages/update-name";
import { MobileBuilder } from "../pages/update-mobile";
import { AddressBuilder } from "../pages/update-address";
import { KeyUpdated } from "../pages/redirection";
import { NameForm, MobileForm, ProfileFormData } from "../models/form-data";

const router = new Router();
const log = debug("user:profile");

/**
 * @description Show profile page.
 */
router.get("/", async (ctx, next) => {
  const account: Account = ctx.state.user;

  // If current account is a wechat-only one,
  // use the sesson data to show user profile.
  if (isAccountWxOnly(account)) {
    return await next();
  }

  // If this page is accessed from redirection after updating successfully.

  // @ts-ignore
  const key: KeyUpdated | undefined = ctx.session.ok;

  const builder = new ProfilePageBuilder();
  await builder.fetchData(account);

  const uiData = builder.build(key);

  Object.assign(ctx.state, uiData);

  await next();
}, async (ctx, next) => {
  ctx.body = await render("profile/profile.html", ctx.state);

  // @ts-ignore
  delete ctx.session.ok;
});

router.get("/display-name", async (ctx, next) => {
  const account: Account = ctx.state.user;

  const builder = new DisplayNameBuilder();
  await builder.fetchProfile(account);

  const uiData = builder.build();

  Object.assign(ctx.state, uiData);

  ctx.body = await render("profile/single-input.html", ctx.state);
});

router.post("/display-name", async (ctx, next) => {
  const account: Account = ctx.state.user;

  const formData: NameForm = ctx.request.body;

  const builder = new DisplayNameBuilder();

  const isValid = await builder.validate(formData);
  if (!isValid) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  const ok = await builder.update(account);
  if (!ok) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }
  const key: KeyUpdated = "saved";

  account.userName = builder.formData?.userName || null;

  // @ts-ignore
  ctx.session.user = account;
  // @ts-ignore
  ctx.session.ok = key;
  return ctx.redirect(profileMap.base);
}, async (ctx, next) => {
    ctx.body = await render("profile/single-input.html", ctx.state);
  }
);

router.get("/mobile", async (ctx, next) => {
  const account: Account = ctx.state.user;

  const builder = new MobileBuilder();
  await builder.fetchProfile(account);

  const uiData = builder.build();
  Object.assign(ctx.state, uiData);

  ctx.body = await render("profile/single-input.html", ctx.state);
});

router.post("/mobile", async (ctx, next) => {
  const account: Account = ctx.state.user;

  const formData: MobileForm = ctx.request.body;

  const builder = new MobileBuilder();
  const isValid = await builder.validate(formData);
  if (!isValid) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  const ok = await builder.update(account);
  if (!ok) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  const key: KeyUpdated = "saved";

  // @ts-ignore
  ctx.session.ok = key;

  return ctx.redirect(profileMap.base);
}, async (ctx, next) => {
  ctx.body = await render("profile/single-input.html", ctx.state);
});

router.get("/info", async (ctx, next) => {
  const account: Account = ctx.state.user;

  const builder = new PersonalInfoBuilder();
  await builder.fetchProfile(account);

  const uiData = builder.build();

  Object.assign(ctx.state, uiData);

 ctx.body = await render("profile/personal.html", ctx.state);
});

router.post("/info", async (ctx, next) => {
    const account: Account = ctx.state.user;
    const formData: ProfileFormData | undefined = ctx.request.body.profile;

    if (!formData) {
      throw new Error("form data not found to update profile");
    }

    const builder = new PersonalInfoBuilder();

    const isValid = await builder.validate(formData);
    if (!isValid) {
      const uiData = builder.build();
      Object.assign(ctx.state, uiData);
      return await next();
    }

    const ok = await builder.update(account);
    if (!ok) {
      const uiData = builder.build();
      Object.assign(ctx.state, uiData);
      return await next();
    }

    const key: KeyUpdated = "saved";

    // @ts-ignore
    ctx.session.ok = key;

    return ctx.redirect(profileMap.base);
  },
  async (ctx, next) => {
    ctx.body = await render("profile/personal.html", ctx.state);
  }
);

router.get("/address", async (ctx, next) => {
  const account: Account = ctx.state.user;

  const builder = new AddressBuilder();

  await builder.fetch(account);

  const uiData = await builder.build();

  Object.assign(ctx.state, uiData);

  ctx.body = await render("profile/address.html", ctx.state);
});

router.post("/address", async (ctx, next) => {
    const account: Account = ctx.state.user;
    const formData: Address | undefined = ctx.request.body.address;

    if (!formData) {
      throw new Error("form data to upate address not found");
    }

    const builder = new AddressBuilder();
    const isValid = await builder.validate(formData);
    if (!isValid) {
      const uiData = builder.build();
      Object.assign(ctx.state, uiData);
      return await next();
    }
    const ok = await builder.update(account);
    if (!ok) {
      const uiData = builder.build();
      Object.assign(ctx.state, uiData);
      return await next();
    }

    const key: KeyUpdated = "saved";

    // @ts-ignore
    ctx.session.ok = key;
    return ctx.redirect(profileMap.base);
  },
  async (ctx, next) => {
    ctx.body = await render("profile/address.html", ctx.state);
  }
);

export default router.routes();
