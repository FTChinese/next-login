const Router = require('koa-router');
const debug = require('debug')('user:subscription');
const render = require('../../util/render');

const Account = require("../../lib/account");
const {
  paywall,
} = require("../../model/paywall");

const payRouter = require("./pay");
const payResult = require("./pay-result");
const redeem = require("./redeem");

const router = new Router();

/**
 * @description Show membership
 * /user/subscription
 */
router.get('/', async (ctx, next) => {
  /**
   * @type {Account}
   */
  const account = ctx.state.user;
  const acntData = await account.fetch();

  debug("Account: %O", acntData);

  ctx.state.user = new Account(acntData);

  /**
   * @type {IPaywall}
   */
  const paywallData = paywall.getPaywall();

  ctx.state.products = paywallData.products;
  ctx.state.mailTo = account.buildMailTo();

  ctx.body = await render('subscription/membership.html', ctx.state);

  // Update session data.
  if (acntData) {
    ctx.session.user = acntData;
  }
});

/**
 * @description Renew membership
 * /user/subscription/renew
 */
router.get("/renew", async (ctx, next) => {
  /**
   * @type {Account}
   */
  const account = ctx.state.user;

  const member = account.member;

  // If user is not a member yet, do not show this page.
  if (!member.tier || !member.cycle) {
    ctx.status = 404;
    return;
  }

  const plan = paywall.findPlan(member.tier, member.cycle);

  if (!plan) {
    ctx.status = 404;
    return;
  }

  ctx.state.plan = plan;

  ctx.body = await render("subscription/pay.html", ctx.state);
});

/**
 * @description Show orders
 * /user/subscription/orders
 */
router.get("/orders", async (ctx, enxt) => {

  /**
   * @type {Account}
   */
  const account = ctx.state.user;

  const orders = await account.fetchOrders();

  ctx.state.orders = orders;

  ctx.body = await render("subscription/orders.html", ctx.state)
});

/**
 * @description handle payment
 * /user/subscription/pay/standard/month
 * /user/subscription/pay/standard/year
 * /user/subscription/pay/premium/month
 */
router.use("/pay", payRouter);

/**
 * @description Show payment result.
 */
router.use("/done", payResult);

/**
 * @description Redeem gift card
 */
router.use("/redeem", redeem);

module.exports = router.routes();
