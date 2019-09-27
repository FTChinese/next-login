import Router from "koa-router";
import render from "../util/render";
import {
    appHeader,
} from "./middleware";
import {  
    IAppHeader,
    Account,
    IEmail,
} from "../models/reader";
import { 
    accountMap 
} from "../config/sitemap";
import { 
    SavedKey,
} from "../viewmodels/ui";
import {
    accountViewModel,
    IPasswordsFormData,
} from "../viewmodels/account-viewmodel";

const router = new Router();

router.get("/", async (ctx, next) => {
    const account: Account = ctx.state.user;

    if (account.isWxOnly()) {
        return await next();
    }

    const key: SavedKey | undefined = ctx.session.ok;

    const uiData = await accountViewModel.buildAccountUI(account, key);

    Object.assign(ctx.state, uiData);

    return await next();
}, async (ctx, next) => {
    ctx.body = await render("account/account.html", ctx.state);

    delete ctx.session.ok;
});

router.get("/email", async (ctx, next) => {
    const account: Account = ctx.state.user;

    if (account.isWxOnly()) {
        ctx.status = 404;
        return;
    }

    const uiData = await accountViewModel.buildEmailUI(account);

    Object.assign(ctx.state, uiData);

    ctx.body = await render("account/update-email.html", ctx.state);
});

router.post("/email", async (ctx, next) => {
    const account: Account = ctx.state.user;

    if (account.isWxOnly()) {
        ctx.status = 404;
        return;
    }

    const formData: IEmail = ctx.request.body;

    const { success, errForm, errApi } = await accountViewModel.updateEmail(account, formData);

    if (!success) {
        const uiData = await accountViewModel.buildEmailUI(
            account,
            formData,
            { errForm, errApi },
        );

        Object.assign(ctx.state, uiData);

        return await next();
    }

    const key: SavedKey = "saved";

    ctx.session.ok = key;

    return ctx.redirect(accountMap.base);

}, async (ctx, next) => {
    ctx.body = await render("account/update-email.html", ctx.state);
});

router.get("/password", async (ctx, next) => {

    const uiData = accountViewModel.buildPasswordsUI();

    Object.assign(ctx.state, uiData);

    ctx.body = await render("account/password.html", ctx.state);
});

router.post("/password", async (ctx, next) => {
    const account: Account = ctx.state.user;

    if (account.isWxOnly()) {
        ctx.status = 404;
        return;
    }

    const formData: IPasswordsFormData = ctx.request.body;

    const { success, errForm, errApi } = await accountViewModel.updatePassword(account, formData);

    if (!success) {
        const uiData = accountViewModel.buildPasswordsUI({ errForm, errApi });

        Object.assign(ctx.state, uiData);

        return await next();
    }
    
    const key: SavedKey = "password_saved";

    ctx.session.ok = key;

    return ctx.redirect(accountMap.base);
}, async (ctx, next) => {
    ctx.body = await render("account/password.html", ctx.state);
});

router.post("/request-verification", async (ctx, next) => {

});

router.get("/link/email", async (ctx, next) => {
    ctx.body = await render("account/email-exists.html", ctx.state);
});

router.post("/link/email", async (ctx, next) => {

});

router.get("/link/login", async (ctx, next) => {
    ctx.body = await render("account/login.html", ctx.state);
});

router.post("/link/login", async (ctx, next) => {

});

router.get("/link/merge", async (ctx, next) => {
    ctx.body = await render("account/merge.html", ctx.state);
});

router.post("/link/merge", async (ctx, next) => {
    const account: Account = ctx.state.user;

    if (account.isWxOnly()) {
        ctx.status = 404;
        return;
    }
});

router.get("/link/signup", async (ctx, next) => {
    ctx.body = await render("account/signup.html", ctx.state);
});

router.post("/link/signup", async (ctx, next) => {

});

export default router.routes();
