import Router from "koa-router";
import render from "../util/render";
import {
    appHeader,
} from "./middleware";
import {  
    IAppHeader,
    Account,
    Tier,
    Cycle,
} from "../models/reader";
import { 
    subsMap 
} from "../config/sitemap";
import {
    subViewModel,
} from "../viewmodels/sub-viewmodel";
import { 
    isProduction,
} from "../config/viper";

const router = new Router();

/**
 * @description Show membership
 * /user/subscription
 */
router.get("/", async(ctx, next) => {
    const account: Account = ctx.state.user;

    const { success, errResp} = await subViewModel.refresh(account);

    if (errResp) {
        const uiData = subViewModel.buildErrorUI(errResp);

        Object.assign(ctx.state, uiData);

        ctx.body = await render("layouts/two-cols.html", ctx.state);
        return;
    }

    if (!success) {
        throw new Error("Unknown error");
    }

    // Update session data.
    ctx.session.user = success;

    // If current user has membership, show membership page.
    if (success.membership.isMember) {

        ctx.state.data = subViewModel.buildMemberUI(success.membership);

        ctx.body = await render("subscription/membership.html", ctx.state);
        return;
    }
    
    // Otherwise show paywall.
    Object.assign(ctx.state, subViewModel.buildPaywallUI());

    ctx.body = await render("subscription/paywall.html", ctx.state);
});

/**
 * @description Renew membership
 * /user/subscription/renew
 */
router.get("/renew", async (ctx, next) => {
    const account: Account = ctx.state.user;

    ctx.body = await render("subscription/pay.html", ctx.state);
});

router.get("/orders", async (ctx, next) => {
    const account: Account = ctx.state.user;

    ctx.body = await render("subscription/orders.html", ctx.state)
});

router.get("/pay/:tier/:cycle", async (ctx, next) => {
    const tier: Tier = ctx.params.tier;
    const cycle: Cycle = ctx.params.cycle;

    ctx.body = await render("subscription/pay.html", ctx.state);
});

router.post("/pay/:tier/:cycle", async (ctx, next) => {
    const tier: Tier = ctx.params.tier;
    const cycle: Cycle = ctx.params.cycle;
});

/**
 * @description Show alipay result.
 * The result is parsed from url query paramters.
 * GET /subscription/done/ali
 */
router.get("/done/ali", async (ctx, next) => {
    ctx.body = await render("subscription/alipay-done.html", ctx.state);

    // For development, keep session to test ui.
    if (isProduction) {
      delete ctx.session.subs;
    }
});

router.get("/done/wx", async (ctx, next) => {

}, async (ctx) => {
    ctx.body = await render("subscription/wxpay-done.html", ctx.state);

    if (isProduction) {
        delete ctx.session.subs;
    }
});

export default router.routes();
