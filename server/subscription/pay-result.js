const debug = require("debug")("user:pay-result");
const Router = require("koa-router");
const render = require("../../util/render");
const Account = require("../../lib/account");
const {
  isProduction
} = require("../../lib/config");
const {
  ClientError,
} = require("../../lib/request");

const router = new Router();

/**
 * @description Show alipay result.
 * The result is parsed from url query paramters.
 * GET /subscription/done/ali
 */
router.get("/ali", async(ctx, next) => {
  /**
   * @type {{charset: string, out_trade_no: string, method: string, total_amount: string, sign: string, trade_no: string, auth_app_id: string, version; string, app_id: string, sign_type: string, seller_id: string, timestamp: string}}
   */
  const query = ctx.request.query;
  debug("Alipay result: %O", query);

  /**
   * @type {ISubsOrder}
   */
  const subsOrder = ctx.session.subs;
  debug("Sub order from session: %O", subsOrder);

  /**
   * @type {Account}
   */
  const account = ctx.state.user;

  // Refresh user data.
  const acntData = await account.fetch();
  ctx.state.user = new Account(acntData);

  // Show what product user purchased.
  ctx.state.subs = subsOrder;
  // Show transaction details.
  ctx.state.result = {
    totalAmount: query.total_amount,
    transactionId: query.trade_no,
    ftcOrderId: query.out_trade_no,
    paidAt: query.timestamp,
  };
  
  ctx.body = await render("subscription/alipay-done.html", ctx.state);

  // For development, keep session to test ui.
  if (isProduction) {
    delete ctx.session.subs;
  }
});

/**
 * @description Wx pay result
 * GET /subscription/done/wx
 */
router.get("/wx", async(ctx, next) => {
  /**
   * @type {ISubsOrder}
   */
  const subsOrder = ctx.session.subs;
  debug("Subs order from session: %O", subsOrder);

  ctx.state.subs = subsOrder;

  // To test UI.
  ctx.state.result = {
    "paymentState": "SUCCESS",
    "paymentStateDesc": "支付成功",
    "totalFee": 1,
    "transactionId": "4200000252201903069440709666",
    "ftcOrderId": "FT1D3CEDDB2599EFB9",
    "paidAt": "2019-03-06T07:21:18Z"
  };

  return await next();

  if (!subsOrder || !subsOrder.appId) {
    return await next();
  }

  /**
   * @type {Account}
   */
  const account = ctx.state.user;

  try {
    const payResult = await account.wxOrderQuery(subsOrder);
    debug("Wxpay query result: %O", payResult);

    if (payResult.paymentState === "SUCCESS") {
      ctx.state.result = payResult;
    }
  } catch (e) {
    const clientErr = new ClientError(e);

    if (!clientErr.isFromAPI()) {
      throw e;
    }

    switch (e.status) {
      // In case the order does not exist.
      case 404:
        break;

      default:
        ctx.state.errors = clientErr.buildGenericError();
        break;
    }
  }

  await next();
}, async (ctx) => {
  ctx.body = await render("subscription/wxpay-done.html", ctx.state);

  if (isProduction) {
    delete ctx.session.subs;
  }
});

module.exports = router.routes();
