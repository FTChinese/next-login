const request = require('superagent');
const Router = require('koa-router');
const debug = require('debug')('user:membership');

const render = require('../../util/render');
const { nextApi } = require("../../lib/endpoints");
const sitemap = require("../../lib/sitemap");
const { isAPIError, buildApiError } = require("../../lib/response");
const { Membership } = require("../../lib/membership");

const router = new Router();

router.get('/', async (ctx, next) => {
  const userId = ctx.session.user.id;

  const resp = await request
    .get(nextApi.account)
    .set('X-User-Id', userId)

  /**
   * @type {{membership: Object}}
   */
  const account = resp.body;

  const membership = new Membership(account.membership);

  ctx.state.membership = membership.localize();

  ctx.body = await render('subscription/membership.html', ctx.state);
});


module.exports = router.routes();