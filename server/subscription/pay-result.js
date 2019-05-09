const debug = require("debug")("user:pay-result");
const Router = require("koa-router");
const render = require("../../util/render");
const Account = require("../../lib/account");
const {
  isProduction
} = require("../../lib/config");

const router = new Router();

router.get("/ali", async(ctx, next) => {
  const query = ctx.request.query;
  debug("Alipay finished: %O", query);

  /**
   * @type {ISubsOrder}
   */
  const subsOrder = ctx.session.subs;

  debug("Sub order from session: %O", subsOrder);

  /**
   * @type {Account}
   */
  const account = ctx.state.user;

  const acntData = await account.fetch();

  ctx.state.user = new Account(acntData);

  ctx.state.subs = subsOrder;
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

router.get("/wx", async(ctx, next) => {

});

module.exports = router.routes();
