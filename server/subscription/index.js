const Router = require('koa-router');
const debug = require('debug')('user:membership');
const render = require('../../util/render');

const {
  Account,
} = require("../../model/request");

const router = new Router();

/**
 * @description Show membership
 * /user/subscription
 */
router.get('/', async (ctx, next) => {
  const accountWrapper = new Account(ctx.session.user);
  const account = await accountWrapper.fetchAccount();

  debug("Account: %O", account);

  ctx.state.account = account;

  ctx.body = await render('subscription/membership.html', ctx.state);

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

module.exports = router.routes();
