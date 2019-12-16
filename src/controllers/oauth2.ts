import Router from "koa-router";
import render from "../util/render";
import { 
    Account,
} from "../models/reader";
import { 
    entranceMap,
} from "../config/sitemap";
import { 
    oauthViewModel,
    IAuthorizeFormData,
} from "../viewmodels/oauth-viewmodel";
import { 
    IAuthorizeRequest, 
    oauthServer 
} from "../models/ftc-oauth";

const router = new Router();

/**
 * @description Show OAuth page.
 * Session field added: `ctx.session.oauth: IOAuthSession`.
 */
router.get("/authorize", async (ctx, next) => {
    const query: IAuthorizeRequest = ctx.request.query;
    const account: Account | undefined = ctx.state.user;

    const {values, errors} = oauthViewModel.validateRequest(query);

    if (errors) {
        // If we should tell client what errors happened.
        if (errors.shouldRedirect) {
            return ctx.redirect(oauthServer.buildErrorUrl(query, errors));
        }

        // Show error message.
        const uiData = oauthViewModel.buildUI(errors);

        Object.assign(ctx.state, uiData);

        return await next();
    }

    if (!values) {
        throw new Error("Invalid authroization request");
    }

    // If user is not logged-in yet, redirect user to login page.
    if (!account) {
        // @ts-ignore
        ctx.session.oauth = oauthServer.createSession(values);
        return ctx.redirect(entranceMap.login);
    }

    // Authorization request parameters are valid, user already logged in.
    return await next();

}, async (ctx, next) => {
    ctx.body = await render("authorize.html", ctx.state);
});

router.post("/authorize", async (ctx, next) => {
    const query: IAuthorizeRequest = ctx.request.query;
    const account: Account | undefined = ctx.state.user;
    const formData: IAuthorizeFormData = ctx.request.body;

    // Validate both query parameters and form data in one step.
    const {values, errors} = oauthViewModel.validate(query, formData);

    if (errors) {
        // If we should tell client what errors happened.
        if (errors.shouldRedirect) {
            return ctx.redirect(oauthServer.buildErrorUrl(query, errors));
        }

        // Show error message.
        const uiData = oauthViewModel.buildUI(errors);

        Object.assign(ctx.state, uiData);

        return await next();
    }

    if (!values) {
        throw new Error("Invalid authroization request");
    }

    // If user is not logged-in yet, redirect user to login page.
    if (!account) {
        return ctx.redirect(entranceMap.login);
    }

    const { success, errParam, errResp } = await oauthViewModel.requestCode(values, account);

    if (!success) {
        const uiData = oauthViewModel.buildUI(errParam, errResp)

        Object.assign(ctx.state, uiData);

        return await next();
    }

}, async (ctx, next) => {
    ctx.body = await render("authorize.html", ctx.state);
});

export default router.routes();
