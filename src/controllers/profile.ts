import debug from "debug";
import Router from "koa-router";
import render from "../util/render";
import {
  Account,
  ProfileFormData,
  IName,
  IMobile,
  IAddress,
} from "../models/reader";
import { profileViewModel, ProfilePageBuilder } from "../pages/profile-list";
import { KeyUpdated } from "../pages/profile-list";
import { profileMap } from "../config/sitemap";
import { profileService } from "../repository/profile";
import { ProfileInfoBuilder, ProfileInfoPage } from "../pages/profile-info";
import { DisplayNameBuilder } from "../pages/display-name";
import { MobileBuilder } from "../pages/modile";
import { AddressBuilder } from "../pages/address";

const router = new Router();
const log = debug("user:profile");

/**
 * @description Show profile page.
 */
router.get("/", async (ctx, next) => {
  const account: Account = ctx.state.user;

  // If current account is a wechat-only one,
  // use the sesson data to show user profile.
  if (account.isWxOnly()) {
    return await next();
  }

  // If this page is accessed from redirection after updating successfully.

  // @ts-ignore
  const key: KeyUpdated | undefined = ctx.session.ok;

  const builder = new ProfilePageBuilder();
  await builder.fetchData(account);

  const uiData = builder.build(key);

  Object.assign(ctx.state, uiData);

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

  const formData: IName = ctx.request.body.profile;

  const builder = new DisplayNameBuilder();

  const isValid = builder.validate(formData);
  if (!isValid) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  const ok = builder.update(account);
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

  const formData: IMobile = ctx.request.body.profile;

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

  try {
    const profile = await profileService.fetchProfile(account.id);

    const builder = new ProfileInfoBuilder(profile);

    const uiData = new ProfileInfoPage(builder);

    Object.assign(ctx.state, uiData);

    return ctx.body = await render("profile/personal.html", ctx.state);
  } catch (e) {
    const uiData = new ProfileInfoBuilder(e.message);

    Object.assign(ctx.state, uiData);

    return ctx.body = await render("profile/personal.html", ctx.state);
  }
});

router.post(
  "/info",
  async (ctx, next) => {
    const account: Account = ctx.state.user;
    const formData: ProfileFormData | undefined = ctx.request.body.profile;

    if (!formData) {
      throw new Error("form data not found to update profile");
    }

    const builder = new ProfileInfoBuilder(formData);

    const isValid = await builder.validate();
    if (!isValid) {
      const uiData = new ProfileInfoPage(builder);
      Object.assign(ctx.state, uiData);
      return await next();
    }

    const ok = await builder.update(account);
    if (!ok) {
      const uiData = new ProfileInfoPage(builder);
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
    const formData: IAddress | undefined = ctx.request.body.address;

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
