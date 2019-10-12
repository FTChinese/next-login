import Router from "koa-router";
import render from "../util/render";
import {
    appHeader,
} from "./middleware";
import {  
    IAppHeader,
    Account,
    IEmail,
    ICredentials,
} from "../models/reader";
import { 
    accountMap 
} from "../config/sitemap";
import { 
    KeyUpdated,
} from "../viewmodels/redirection";
import {
    accountViewModel,
    IPasswordsFormData,
} from "../viewmodels/account-viewmodel";
import {
    linkViewModel,
} from "../viewmodels/link-viewmodel";
import {
    ISignUpFormData,
} from "../viewmodels/validator";
import { 
    isProduction,
} from "../config/viper";
import { accountRepo } from "../repository/account";

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

    // Only exists if user perform update action.
    const key: KeyUpdated | undefined = ctx.session.ok;

    const { success, errResp } = await accountViewModel.refresh(account);

    if (!success) {
        Object.assign(
            ctx.state, 
            accountViewModel.buildAccountUI(
                { errResp },
                key,
            ),
        );

        return await next();
    }

    const uiData = await accountViewModel.buildAccountUI({
        success,
    }, key);

    Object.assign(ctx.state, uiData);

    ctx.session.user = success;

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

    const { success, errResp } = await accountViewModel.refresh(account);

    const uiData = await accountViewModel.buildEmailUI(
        success ? { email: success.email } : undefined,
        { errResp},
    );

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

    const { success, errForm, errResp } = await accountViewModel.updateEmail(account, formData);

    if (!success) {
        const uiData = await accountViewModel.buildEmailUI(
            formData,
            { errForm, errResp },
        );

        Object.assign(ctx.state, uiData);

        return await next();
    }

    const key: KeyUpdated = "saved";

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

    const { success, errForm, errResp } = await accountViewModel.updatePassword(account, formData);

    if (!success) {
        const uiData = accountViewModel.buildPasswordsUI(
            { errForm, errResp }
        );

        Object.assign(ctx.state, uiData);

        return await next();
    }
    
    const key: KeyUpdated = "password_saved";

    ctx.session.ok = key;

    return ctx.redirect(accountMap.base);
}, async (ctx, next) => {
    ctx.body = await render("account/password.html", ctx.state);
});

router.post("/request-verification", async (ctx, next) => {

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
    const formData: IEmail = ctx.request.body;

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
        delete ctx.session.email;
    }
});

router.post("/link/login", 
appHeader(), async (ctx, next) => {
    const formData: ICredentials | undefined = ctx.request.body.credentials;

    if (!formData) {
        throw new Error("form data not found");
    }

    const headers: IAppHeader = ctx.state.appHeaders;

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
    ctx.session.uid = success;
    ctx.redirect(accountMap.linkMerging);

}, async (ctx, next) => {
    ctx.body = await render("account/login.html", ctx.state);
});

router.get("/link/signup", async (ctx, next) => {
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
        delete ctx.session.email;
    }
});

router.post("/link/signup", appHeader(), async (ctx, next) => {
    const formData: ISignUpFormData = ctx.request.body.credentials;

    if (!formData) {
        throw new Error("form data not found");
    }

    const headers: IAppHeader = ctx.state.appHeaders;
    const account: Account = ctx.session.user;
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

    const account: Account = ctx.session.user;

    const targetId: string | undefined = ctx.session.uid;

    if (!targetId) {
        ctx.status = 404;
        return;
    }

    const accounts = await linkViewModel.fetchAccountToLink(account, targetId);

    const uiData = linkViewModel.buildMergeUI(accounts);

    Object.assign(ctx.state, uiData);
    
    ctx.body = await render("account/merge.html", ctx.state);
});

router.post("/link/merge", async (ctx, next) => {
    const account: Account = ctx.state.user;

    if (account.isWxOnly()) {
        ctx.status = 404;
        return;
    }
});

export default router.routes();
