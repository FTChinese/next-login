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
  isProduction,
} from "../config/viper";
import { scheduler } from "../models/paywall";
import {
  IAliCallback, AliOrder, WxOrder,
} from "../models/order";
import { toBoolean } from "../util/converter";
import { MembershipPageBuilder } from "../pages/membership-page";
import { PaymentPageBuilder, isMobile } from "../pages/payment-page";
import { AlipayResultBuilder, WxpayResultBuilder } from "../pages/pay-reseult-page";

const log = debug("user:subscription");
const router = new Router();

/**
 * @description Show membership
 * /user/subscription
 */
router.get("/", async (ctx, next) => {
  const account: Account = ctx.state.user;

  const builder = new MembershipPageBuilder(account);

  const ok = await builder.refresh();
  
  if (ok) {
    // @ts-ignore
    ctx.session.user = builder.account;
  }
  
  Object.assign(ctx.state, builder.build());

  ctx.body = await render("subscription/membership.html", ctx.state);
});

router.get("/orders", async (ctx, next) => {
  const account: Account = ctx.state.user;

  ctx.body = await render("subscription/orders.html", ctx.state)
});

/**
 * @description Show payment methods
 * URL query: `?sandbox=true|false`
 */
router.get("/pay/:tier/:cycle", async (ctx, next) => {
  const tier: Tier = ctx.params.tier;
  const cycle: Cycle = ctx.params.cycle;
  const account: Account = ctx.state.user;

  const plan = scheduler.findPlan(tier, cycle);
  const sandbox: boolean = toBoolean(ctx.request.query.sandbox);

  if (!plan) {
    ctx.status = 404;
    return;
  }

  const builder = new PaymentPageBuilder(plan, account, sandbox);

  const uiData = await builder.build();

  Object.assign(
    ctx.state,
    uiData,
  );

  ctx.body = await render("subscription/pay.html", ctx.state);
});

/**
 * @description Start payment process.
 * `ctx.session.order: OrderBase` is added for verification after callback.
 * 
 * URL query: `?sandbox=true|false`
 */
router.post("/pay/:tier/:cycle", collectAppHeaders(), async (ctx, next) => {
  const tier: Tier = ctx.params.tier;
  const cycle: Cycle = ctx.params.cycle;
  const account: Account = ctx.state.user;

  const plan = scheduler.findPlan(tier, cycle);
  if (!plan) {
    ctx.status = 404;
    return;
  }

  const sandbox: boolean = toBoolean(ctx.request.query.sandbox);
  const payMethod: PaymentMethod | undefined = ctx.request.body.payMethod;
  
  const builder = new PaymentPageBuilder(plan, account, sandbox);

  const isValid = builder.validate(payMethod);
  if (!isValid) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  switch (payMethod) {
    case 'alipay': {
      const aliOrder = await builder.alipay(
        ctx.state.appHeaders,
        isMobile(ctx.header["user-agent"])
      );

      if (!aliOrder) {
        const uiData = await builder.build();
        Object.assign(ctx.state, uiData);

        return await next();
      }

      // Used to validate callback data.
      // @ts-ignore
      ctx.session.order = aliOrder;
      return ctx.redirect(aliOrder.redirectUrl);
    }
      
    case 'wechat': {
      const ok = await builder.wxpay(ctx.state.appHeaders);

      if (ok) {
        // @ts-ignore
        ctx.session.order = builder.wxOrder
      }

      const uiData = await builder.build();

      Object.assign(ctx.state, uiData);

      return await next();
    }
     
    default:
      throw new Error('Unkonw payment method');
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
  const order: AliOrder | undefined = ctx.session.order;

  if (!order) {
    throw new Error("Order data missing in this session!");
  }

  const builder = new AlipayResultBuilder(account, order);

  const isValid = builder.validate(query);
  if (!isValid) {
    const uiData = builder.build()
    Object.assign(ctx.state, uiData);

    return await next();
  }

  const newAccount = await builder.refresh()
  if (!newAccount) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  // @ts-ignore
  ctx.session.user = newAccount;

  const uiDate = builder.build();
  Object.assign(ctx.state, uiDate);

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
  const order: WxOrder | undefined = ctx.session.order;

  if (!order) {
    throw new Error("Order data missing in this session!");
  }

  // To test UI.
  // const queryResult: IWxQueryResult = {
  //     "paymentState": "SUCCESS",
  //     "paymentStateDesc": "支付成功",
  //     "totalFee": 1,
  //     "transactionId": "4200000252201903069440709666",
  //     "ftcOrderId": "FT1D3CEDDB2599EFB9",
  //     "paidAt": "2019-03-06T07:21:18Z"
  // };

  const builder = new WxpayResultBuilder(account, order);

  const isValid = await builder.validate()

  if (!isValid) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);

    return await next();
  }

  const newAccount = await builder.refresh();
  if (!newAccount) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);

    return await next();
  }

  // @ts-ignore
  ctx.session.user = newAccount;

  const uiDate = builder.build();
  Object.assign(ctx.state, uiDate);

  if (isProduction) {
    // @ts-ignore
    delete ctx.session.order;
  }

  return await next();
}, async (ctx) => {
  ctx.body = await render("subscription/pay-done.html", ctx.state);
});

export default router.routes();
