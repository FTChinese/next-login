import Router from "koa-router";
import debug from "debug";
import { toDataURL } from "qrcode";
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
import { subRepo } from "../repository/subscription";
import { 
    AliOrder, 
    IAliCallback, 
    orderSerializer 
} from "../models/order";
import { APIError } from "../viewmodels/api-response";
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
    const sandbox: string | undefined = ctx.request.query.sandbox;

    if (!plan) {
        ctx.status = 404;
        return;
    }

    Object.assign(
        ctx.state, 
        subViewModel.buildPaymentUI(
            plan, 
            toBoolean(sandbox),
        ),
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

    const sandbox: string | undefined = ctx.request.query.sandbox;

    const payMethod: PaymentMethod | undefined = ctx.request.body.payMethod;

    const formState = subViewModel.validatePayMethod(payMethod);
    if (!formState.value) {
        Object.assign(
            ctx.state, 
            subViewModel.buildPaymentUI(
                plan, 
                toBoolean(sandbox), 
                { formState, },
            )
        );

        return await next();
    }

    const isMobile = subViewModel.isMobile(ctx.header["user-agent"]);

    const account: Account = ctx.state.user;

    try {
        switch (payMethod) {
            case "alipay":
                let aliOrder: AliOrder;
                if (isMobile) {
                    aliOrder = await subRepo.aliMobilePay(
                        account,
                        plan,
                        ctx.state.appHeaders,
                    );

                    
                } else {
                    aliOrder = await subRepo.aliDesktopPay(
                        account,
                        plan,
                        ctx.state.appHeaders,
                    );
                }
                ctx.redirect(aliOrder.redirectUrl);
                ctx.session.order = aliOrder;
                return;

            case "wechat":
                const wxOrder = await subRepo.wxDesktopPay(
                    account,
                    plan,
                    ctx.state.appHeaders,
                );

                log("Wechat order: %O", wxOrder);

                const dataUrl = await toDataURL(wxOrder.qrCodeUrl);
                
                Object.assign(
                    ctx.state, 
                    subViewModel.buildPaymentUI(
                        plan,
                        toBoolean(sandbox),
                        {
                            qrData: dataUrl,
                        },
                    )
                );

                return await next();
        }
    } catch (e) {
        log("Payment error: %O", e);
        
        ctx.state.errors = {
            message: e.message,
        };

        Object.assign(
            ctx.state,
            subViewModel.buildPaymentUI(
                plan,
                toBoolean(sandbox),
                {
                    formState,
                    errResp: new APIError(e),
                }
            )
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

    ctx.session.user = success;
    Object.assign(ctx.state, subViewModel.buildAliResultUI(
        order,
        query,
        {},
    ));
    // For development, keep session to test ui.
    if (isProduction) {
      delete ctx.session.order;
    }

    return await next();
}, async (ctx, next) => {
    ctx.body = await render("subscription/pay-done.html", ctx.state);
});

router.get("/done/wx", async (ctx, next) => {
    const account: Account = ctx.state.user;
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

    ctx.session.user = success;
    Object.assign(ctx.state, subViewModel.buildWxResultUI(
        order,
        { queryResult },
    ));

    if (isProduction) {
        delete ctx.session.subs;
    }

    return await next();
}, async (ctx) => {
    ctx.body = await render("subscription/pay-done.html", ctx.state);
});

export default router.routes();
