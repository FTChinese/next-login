const Router = require('koa-router');
const debug = require('debug')('user:subscription');
const render = require('../../util/render');

const Account = require("../../lib/account");
const Membership = require("../../lib/member");
/**
 * @type {IPaywall}
 */
const defaultPaywall = require("../../model/paywall-default.json");
const {
  paywall,
} = require("../../model/paywall");

const payRouter = require("./pay");
const payResult = require("./pay-result");
const redeem = require("./redeem");

const {
  sitemap,
} = require("../../lib/sitemap");

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

router.get("/test", async (ctx, next) => {
  const accountWrapper = new Account(ctx.session.user);
  const account = await accountWrapper.fetchAccount();

  debug("Account: %O", account);

  ctx.state.account = account;
  ctx.state.member = new Membership(account.membership);

  ctx.state.products = defaultPaywall.products;

  ctx.body = await render('subscription/membership-test.html', ctx.state);

  if (account && account.hasOwnProperty("id")) {
    ctx.session.user = account;
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
 * @description Redeem gift card
 */
router.use("/redeem", redeem);

/**
 * @description Handle pay result
 * /user/subscription/alipay/callback
 */
router.get("/alipay/callback", async (ctx, next) => {
  /**
   * @type {{error: string, error_description}}
   */
  const query = ctx.query;
  if (query.error) {
    ctx.state.errors = {
      message: query.error_description || query.error
    }

    ctx.body = await render("subscription/alipay-result.html", ctx.state);

    return;
  }

  ctx.redirect(sitemap.subs);
});

router.use("/done", payResult);

module.exports = router.routes();
