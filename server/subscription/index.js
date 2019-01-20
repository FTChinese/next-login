const request = require('superagent');
const Router = require('koa-router');
const debug = require('debug')('user:membership');

const render = require('../../util/render');
const { nextApi } = require("../../lib/endpoints");
const sitemap = require("../../lib/sitemap");
const { isAPIError, buildApiError } = require("../../lib/response");
const { Membership } = require("../../lib/membership");
const { setUserId, setUserOrUnionId } = require("../../lib/request");

const router = new Router();

router.get('/', async (ctx, next) => {
  const userId = ctx.session.user.id;

  const resp = await request
    .get(nextApi.account)
    .set(setUserId(userId));

  /**
   * @type {{membership: Object}}
   */
  const account = resp.body;

  const membership = new Membership(account.membership).normalize();

  ctx.state.membership = membership;

  ctx.body = await render('subscription/membership.html', ctx.state);
});

router.get("/orders", async (ctx, enxt) => {
  const userId = ctx.session.user.id;
  const unionId = ctx.session.user.unionId;

  const resp = await request.get(nextApi.order)
    .set(setUserOrUnionId(userId, unionId))
  
  const orders = resp.body;

  ctx.state.orders = orders;

  // ctx.body = orders;
  ctx.body = await render("subscription/orders.html", ctx.state)
});

module.exports = router.routes();