const Router = require('koa-router');
const debug = require('debug')('user:subscription');
const render = require('../../util/render');

const {
  findPlan,
} = require("../../model/paywall");
const Account = require("../../lib/account");
const Membership = require("../../model/member");
/**
 * @type {IPaywall}
 */
const defaultPaywall = require("../../model/paywall-default.json");

const payRouter = require("./pay");

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
  const accountData = await account.refreshAccount();

  debug("Account: %O", accountData);

  ctx.state.account = accountData;
  ctx.state.member = new Membership(account.membership);

  console.log(ctx.state.member);

  ctx.state.products = defaultPaywall.products;

  ctx.body = await render('subscription/membership.html', ctx.state);

  // Update session data.
  if (accountData && accountData.id) {
    ctx.session.user = accountData;
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
  const accountWrapper = new Account(ctx.session.user);

  const account = await accountWrapper.fetchAccount();

  const member = account.membership;

  // If user is not a member yet, do not show this page.
  if (!member.tier || !member.cycle) {
    ctx.status = 404;
    return;
  }

  const plan = findPlan(member.tier, member.cycle);

  if (!plan) {
    ctx.status = 404;
    return;
  }

  ctx.state.plan = plan;

  ctx.body = await render("subscription/pay.html", ctx.state);

  // Update session data.
  if (account && account.hasOwnProperty("id")) {
    ctx.session.user = account;
  }
});

/**
 * @description Show orders
 * /user/subscription/orders
 */
router.get("/orders", async (ctx, enxt) => {

  const account = new Account(ctx.session.user);

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

module.exports = router.routes();
