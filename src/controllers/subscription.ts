import Router from "koa-router";
import debug from "debug";
import render from "../util/render";
import {
    collectAppHeaders,
} from "./middleware";
import {  
    Account,
} from "../models/reader";
import {
    Tier,
    Cycle,
    PaymentMethod,
} from "../models/enums";
import {
    subViewModel,
} from "../viewmodels/sub-viewmodel";
import { 
    isProduction,
} from "../config/viper";
import { scheduler } from "../models/paywall";
import { 
    IAliCallback, 
    orderSerializer 
} from "../models/order";
import { toBoolean } from "../util/converter";

const log = debug("user:subscription");
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

        ctx.body = await render("layouts/content.html", ctx.state);
        return;
    }

    if (!success) {
        throw new Error("Unknown error");
    }

    // Update session data.

    // @ts-ignore
    ctx.session.user = success;

    // If current user has membership, show membership page.
    if (success.membership.isMember) {

        ctx.state.data = subViewModel.buildMemberUI(success.membership);

        ctx.body = await render("subscription/membership.html", ctx.state);
        return;
    }
    
    // Otherwise show paywall.
    Object.assign(ctx.state, subViewModel.buildPaywallUI(scheduler.paywall));

    ctx.body = await render("subscription/paywall.html", ctx.state);
});

/**
 * @description Renew membership
 * /user/subscription/renew
 */
router.get("/renew", async (ctx, next) => {
    const account: Account = ctx.state.user;

    const redirectTo = account.membership.renewalUrl;

    if (!redirectTo) {
        ctx.status = 404;
        return;
    }

    ctx.redirect(redirectTo);
});

router.get("/orders", async (ctx, next) => {
    const account: Account = ctx.state.user;

    ctx.body = await render("subscription/orders.html", ctx.state)
});

/**
 * @description Show payment methods
 */
router.get("/pay/:tier/:cycle", async (ctx, next) => {
    const tier: Tier = ctx.params.tier;
    const cycle: Cycle = ctx.params.cycle;

    const plan = scheduler.findPlan(tier, cycle);
    const sandbox: boolean = toBoolean(ctx.request.query.sandbox);

    if (!plan) {
        ctx.status = 404;
        return;
    }

    const uiData = await subViewModel.buildPaymentUI(plan, sandbox);

    Object.assign(
        ctx.state, 
        uiData,
    );

    ctx.body = await render("subscription/pay.html", ctx.state);
});

/**
 * @description Start payment process.
 * `ctx.session.order: OrderBase` is added for verification after callback.
 */
router.post("/pay/:tier/:cycle", collectAppHeaders(), async (ctx, next) => {
    const tier: Tier = ctx.params.tier;
    const cycle: Cycle = ctx.params.cycle;

    const plan = scheduler.findPlan(tier, cycle);
    if (!plan) {
        ctx.status = 404;
        return;
    }

    const sandbox: boolean = toBoolean(ctx.request.query.sandbox);

    const payMethod: PaymentMethod | undefined = ctx.request.body.payMethod;

    const account: Account = ctx.state.user;

    // The payment result does not contain `errResp` field.
    const { formState, aliOrder, wxOrder } = await subViewModel.pay(
        plan,
        {
            ...account.idHeaders,
            ...ctx.state.appHeaders,
        },
        subViewModel.isMobile(ctx.header["user-agent"]),
        sandbox,
        payMethod,
    );

    // Form error
    if (formState && formState.error) {
        const uiData = await subViewModel.buildPaymentUI(plan, sandbox, { formState });

        Object.assign(
            ctx.state, 
            uiData,
        );

        return await next();
    }

    // Handle alipay
    if (aliOrder) {
        // @ts-ignore
        ctx.session.order = aliOrder;
        return ctx.redirect(aliOrder.redirectUrl);
    }

    
    // Handle wxpay.
    if (wxOrder) {
        const uiData = await subViewModel.buildPaymentUI(
            plan,
            sandbox,
            { wxOrder }
        )

        Object.assign(
            ctx.state,
            uiData,
        );

        return await next();
    }

}, async (ctx, next) => {
    ctx.body = await render("subscription/pay.html", ctx.state);
});

/**
 * @description Show alipay result.
 * The result is parsed from url query paramters.
 * GET /subscription/done/ali
 */
router.get("/done/ali", async (ctx, next) => {
    const account: Account = ctx.state.user;
    const query: IAliCallback = ctx.request.query;

    // @ts-ignore
    const orderData = ctx.session.order;

    const order = orderSerializer.parse(orderData)!;

    const { success, invalid, errResp } = await subViewModel.aliPayDone(
        account,
        order,
        query,
    );

    if (!success) {
        const uiData = subViewModel.buildAliResultUI(
            order,
            query,
            { invalid, errResp },
        );

        Object.assign(ctx.state, uiData);

        return await next();
    }

    // @ts-ignore
    ctx.session.user = success;
    Object.assign(ctx.state, subViewModel.buildAliResultUI(
        order,
        query,
        {},
    ));
    // For development, keep session to test ui.
    if (isProduction) {
        // @ts-ignore
      delete ctx.session.order;
    }

    return await next();
}, async (ctx, next) => {
    ctx.body = await render("subscription/pay-done.html", ctx.state);
});

router.get("/done/wx", async (ctx, next) => {
    const account: Account = ctx.state.user;
    // @ts-ignore
    const orderData = ctx.session.order;
    const order = orderSerializer.parse(orderData)!;

    // To test UI.
    // const queryResult: IWxQueryResult = {
    //     "paymentState": "SUCCESS",
    //     "paymentStateDesc": "支付成功",
    //     "totalFee": 1,
    //     "transactionId": "4200000252201903069440709666",
    //     "ftcOrderId": "FT1D3CEDDB2599EFB9",
    //     "paidAt": "2019-03-06T07:21:18Z"
    // };

    const { success, invalid, errResp, queryResult } = await subViewModel.wxPayDone(account, order.id);

    if (!success) {
        const uiData = subViewModel.buildWxResultUI(
            order,
            { invalid, errResp, queryResult },
        );

        Object.assign(ctx.state, uiData);

        return await next();
    }

    // @ts-ignore
    ctx.session.user = success;
    Object.assign(ctx.state, subViewModel.buildWxResultUI(
        order,
        { queryResult },
    ));

    if (isProduction) {
        // @ts-ignore
        delete ctx.session.subs;
    }

    return await next();
}, async (ctx) => {
    ctx.body = await render("subscription/pay-done.html", ctx.state);
});

export default router.routes();
