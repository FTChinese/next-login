import Router from "koa-router";
import debug from "debug";
import render from "../util/render";
import {
  collectAppHeaders,
} from "./middleware";
import {
  Account,
} from "../models/account";
import {
  Tier,
  Cycle,
  PaymentMethod,
} from "../models/enums";
import {
  viper,
} from "../config/viper";
import {
  IAliCallback, AliOrder, WxOrder,
} from "../models/order";
import { toBoolean } from "../util/converter";
import { MembershipPageBuilder } from "../pages/membership-page";
import { PaymentPageBuilder } from "../pages/payment-page";
import { AlipayResultBuilder, WxpayResultBuilder } from "../pages/pay-reseult-page";
import { findPlan } from "../models/product";
import { subsMap } from "../config/sitemap";
import { isMobile } from "../util/detector";

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

  const plan = findPlan(tier, cycle);
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

  const plan = findPlan(tier, cycle);
  if (!plan) {
    ctx.status = 404;
    return;
  }

  const sandbox: boolean = toBoolean(ctx.request.query.sandbox);
  
  const builder = new PaymentPageBuilder(plan, account, sandbox);

  const payMethod: PaymentMethod | undefined = ctx.request.body.payMethod;

  const isValid = builder.validate(payMethod);
  if (!isValid) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  switch (payMethod) {
    case 'alipay': {
      const callbackUrl = ctx.origin + subsMap.alipayDone;

      log("Alipay return url: %s", callbackUrl);

      const aliOrder = await builder.alipay({
        appHeaders: ctx.state.appHeaders,
        aliCallbackUrl: callbackUrl,
        isMobile: isMobile(ctx.header["user-agent"])
      });

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
 * 
 * Ali first generate url:
 * https://unitradeprod.alipay.com/acq/cashierReturn.htm?sign=K1iSL1z2omRMXaV4MI%252BZ%252F%252B3nlrLJc4hUdi%252F35xPxrHY4t1SYHHAUa9CiaewKvxkZbMv9Ag%253D%253D&outTradeNo=FTA4C1568C670A4ACA&pid=2088521304936335&type=1
 * 
 * Then redirect to:
 * http://next.ftchinese.com/subscription/done/ali?charset=utf-8&out_trade_no=FTA4C1568C670A4ACA&method=alipay.trade.page.pay.return&total_amount=0.01&sign=FX%2B8SO%2ByATsQQblDr07qTEzJE5vNtq2YvMWyWyuSy635VEaTIhg5Rp9%2BYXJMK0wRQnCnf3XZ7nkwMroQMktoLJLciTCNGO%2FbimHbHW6%2BKomWNNYN9Qfsc2O4jGjoN0cnlfHU6ak%2FG0vrx%2FgZqxluaFRGlWLPr5koymr%2FCbIhUMrpCsd8ZfuIto5t1bilPHzkgZqZYNpp%2F7OepZCgudeiwP3sa%2FOYKXesCvl%2Bq%2BnDGUudLOvVXhAkbeFXwKfbC5c6I3Pqv4dZbK0U24Zr3Z7oZFENlufRA%2FbInb8FtchZ4tabI8lF0%2Bu5M%2BtGjIQW%2F%2FA0z0nZRB7kcCivNlqxJQzDXg%3D%3D&trade_no=2020061122001440031406266305&auth_app_id=2018053060263354&version=1.0&app_id=2018053060263354&sign_type=RSA2&seller_id=2088521304936335&timestamp=2020-06-11+15%3A14%3A40
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
  if (viper.isProduction) {
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

  log("Order to verify: %O", order);

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

  if (viper.isProduction) {
    // @ts-ignore
    delete ctx.session.order;
  }

  return await next();
}, async (ctx) => {
  ctx.body = await render("subscription/pay-done.html", ctx.state);
});

export default router.routes();
