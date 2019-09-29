import debug from "debug";
import Router from "koa-router";
import render from "../util/render";
import { 
    Account,
    IProfileFormData,
    INameFormData,
    IMobileFormData,
    IAddress,
} from "../models/reader";
import {
    profileViewModel, 
} from "../viewmodels/profile-viewmodel";
import {
    SavedKey
} from "../viewmodels/ui";
import { 
    profileMap 
} from "../config/sitemap";

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
    const key: SavedKey | undefined = ctx.session.ok;

    // If current is an ftc account, or is linked,
    // fetch data from API.
    const uiData = await profileViewModel.buildProfileUI(account, key);

    Object.assign(ctx.state, uiData);

    return await next();
}, async (ctx, next) => {
    ctx.body = await render("profile/profile.html", ctx.state);

    delete ctx.session.ok;
});

router.get("/display-name", async (ctx, next) => {
    const account: Account = ctx.session.user;

    const uiData = await profileViewModel.buildNameUI(account);

    Object.assign(ctx.state, uiData);

    ctx.body = await render("profile/single-input.html", ctx.state);
});

router.post("/display-name", async (ctx, next) => {
    const account: Account = ctx.session.user;

    const formData: INameFormData = ctx.request.body.profile;

    const { success, errForm, errApi } = await profileViewModel.updateName(account, formData);

    if (!success) {
        const uiData = await profileViewModel.buildNameUI(
            account, 
            formData, 
            { errForm, errApi },
        );

        Object.assign(ctx.state, uiData);

        return await next();
    }

    const key: SavedKey = "saved";

    ctx.session.ok = key;

    return ctx.redirect(profileMap.base);

}, async (ctx, next) => {
    ctx.body = await render("profile/single-input.html", ctx.state);
});

router.get("/mobile", async (ctx, next) => {
    const account: Account = ctx.session.user;

    const uiData = await profileViewModel.buildMobileUI(account);

    Object.assign(ctx.state, uiData);

    ctx.body = await render("profile/single-input.html", ctx.state);
});

router.post("/mobile", async (ctx, next) => {
    const account: Account = ctx.session.user;

    const formData: IMobileFormData = ctx.request.body.profile;

    const { success, errForm, errApi } = await profileViewModel.updateMobile(account, formData);

    if (!success) {
        const uiData = await profileViewModel.buildMobileUI(
            account, 
            formData, 
            { errForm, errApi },
        );

        Object.assign(ctx.state, uiData);

        return await next();
    }

    const key: SavedKey = "saved";

    ctx.session.ok = key;

    return ctx.redirect(profileMap.base);
}, async (ctx, next) => {
    ctx.body = await render("profile/single-input.html", ctx.state);
});

router.get("/info", async (ctx, next) => {
    const account: Account = ctx.session.user;

    const uiData = await profileViewModel.buildInfoUI(account);

    Object.assign(ctx.state, uiData);

    ctx.body = await render("profile/personal.html", ctx.state);
});

router.post("/info", async (ctx, next) => {
    const account: Account = ctx.session.user;
    const formData: IProfileFormData | undefined = ctx.request.body.profile;

    if (!formData) {
        throw new Error("form data not found to update profile");
    }

    const { success, errForm, errApi } = await profileViewModel.updateProfile(account, formData)

    if (!success) {
        const uiData = profileViewModel.buildInfoUI(
            account, 
            formData, 
            { errForm, errApi }
        );

        Object.assign(ctx.state, uiData);

        return await next();
    }

    const key: SavedKey = "saved";

    ctx.session.ok = key;

    return ctx.redirect(profileMap.base);
}, async (ctx, next) => {
    ctx.body = await render("profile/personal.html", ctx.state);
});

router.get("/address", async (ctx, next) => {

    const account: Account = ctx.session.user;

    const uiData = await profileViewModel.buildAddressUI(account);

    Object.assign(ctx.state, uiData);

    ctx.body = await render("profile/address.html", ctx.state);
});

router.post("/address", async (ctx, next) => {
    const account: Account = ctx.session.user;
    const formData: IAddress | undefined = ctx.request.body.address;

    if (!formData) {
        throw new Error("form data to upate address not found");
    }

    const { success, errForm, errApi } = await profileViewModel.updateAddress(account, formData);

    if (!success) {
        const uiData = await profileViewModel.buildAddressUI(
            account, 
            formData,
            { errForm, errApi },
        );

        Object.assign(ctx.state, uiData);

        return await next();
    }
    
    const key: SavedKey = "saved";

    ctx.session.ok = key;

    return ctx.redirect(profileMap.base);
    
}, async (ctx, next) => {
    ctx.body = await render("profile/address.html", ctx.state);
});


export default router.routes();