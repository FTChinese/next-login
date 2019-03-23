const request = require('superagent');
const Router = require('koa-router');
const debug = require('debug')('user:membership');

const render = require('../../util/render');
const {
  nextApi
} = require("../../model/endpoints");
const {
  sitemap
} = require("../../model/sitemap");
const {
  isAPIError,
  buildApiError
} = require("../../lib/response");

const {
  Account,
} = require("../../model/account");

const router = new Router();

router.get('/', async (ctx, next) => {
  const account = new Account(ctx.session.user);

  await account.fetchAccount()

  ctx.state.account = account;

  ctx.body = await render('subscription/membership.html', ctx.state);
});

router.get("/orders", async (ctx, enxt) => {

  const account = new Account(ctx.session.user);

  const orders = await account.fetchOrders();

  ctx.state.orders = orders;

  ctx.body = await render("subscription/orders.html", ctx.state)
});

module.exports = router.routes();
