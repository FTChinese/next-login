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
import { profileViewModel } from "../viewmodels/profile-viewmodel";
import { KeyUpdated } from "../viewmodels/redirection";
import { profileMap } from "../config/sitemap";
import { profileService } from "../repository/profile";
import { ProfileInfoBuilder, ProfileInfoPage } from "../pages/profile";

const router = new Router();
const log = debug("user:profile");

/**
 * @description Show profile page.
 */
router.get(
  "/",
  async (ctx, next) => {
    const account: Account = ctx.state.user;

    // If current account is a wechat-only one,
    // use the sesson data to show user profile.
    if (account.isWxOnly()) {
      return await next();
    }

    // If this page is accessed from redirection after updating successfully.

    // @ts-ignore
    const key: KeyUpdated | undefined = ctx.session.ok;

    // If current is an ftc account, or is linked,
    // fetch data from API.
    const uiData = await profileViewModel.buildProfileUI(account, key);

    Object.assign(ctx.state, uiData);

    return await next();
  },
  async (ctx, next) => {
    ctx.body = await render("profile/profile.html", ctx.state);

    // @ts-ignore
    delete ctx.session.ok;
  }
);

router.get("/display-name", async (ctx, next) => {
  const account: Account = ctx.state.user;

  const { success, errResp } = await profileViewModel.fetchProfile(account);

  const uiData = await profileViewModel.buildNameUI(
    success ? { userName: success.userName || "" } : undefined,
    { errResp }
  );

  Object.assign(ctx.state, uiData);

  ctx.body = await render("profile/single-input.html", ctx.state);
});

router.post(
  "/display-name",
  async (ctx, next) => {
    const account: Account = ctx.state.user;

    const formData: IName = ctx.request.body.profile;

    const { success, errForm, errResp } = await profileViewModel.updateName(
      account,
      formData
    );

    if (!success) {
      const uiData = await profileViewModel.buildNameUI(formData, {
        errForm,
        errResp,
      });

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

  const { success, errResp } = await profileViewModel.fetchProfile(account);

  const uiData = profileViewModel.buildMobileUI(
    success ? { mobile: success.mobile || "" } : undefined,
    { errResp }
  );

  Object.assign(ctx.state, uiData);

  ctx.body = await render("profile/single-input.html", ctx.state);
});

router.post(
  "/mobile",
  async (ctx, next) => {
    const account: Account = ctx.state.user;

    const formData: IMobile = ctx.request.body.profile;

    const { success, errForm, errResp } = await profileViewModel.updateMobile(
      account,
      formData
    );

    if (!success) {
      const uiData = await profileViewModel.buildMobileUI(formData, {
        errForm,
        errResp,
      });

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

  const { success, errResp } = await profileViewModel.fetchAddress(account);

  const uiData = await profileViewModel.buildAddressUI(success, { errResp });

  Object.assign(ctx.state, uiData);

  ctx.body = await render("profile/address.html", ctx.state);
});

router.post(
  "/address",
  async (ctx, next) => {
    const account: Account = ctx.state.user;
    const formData: IAddress | undefined = ctx.request.body.address;

    if (!formData) {
      throw new Error("form data to upate address not found");
    }

    const { success, errForm, errResp } = await profileViewModel.updateAddress(
      account,
      formData
    );

    if (!success) {
      const uiData = await profileViewModel.buildAddressUI(formData, {
        errForm,
        errResp,
      });

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
