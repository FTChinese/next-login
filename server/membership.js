const debug = require('debug')('user:membership');
const Router = require('koa-router');
const request = require('superagent');
const render = require('../util/render');
const endpoints = require('../util/endpoints');
const {iso8601ToDate} = require('../util/format-time.js');

const router = new Router();

router.get('/', async (ctx, next) => {
  const userId = ctx.session.user.id;

  const resp = await request
    .get(endpoints.account)
    .set('X-User-Id', userId)

  /**
   * @type {Membership}
   */
  const account = resp.body;

  const membership = account.membership;

  ctx.state.membership = {
    tier: `${normalizeMemberTier(membership.tier)}${normializeCycle(membership.billingCycle)}`,
    startAt: iso8601ToDate(membership.startAt),
    expireAt: iso8601ToDate(membership.expireAt),
  };

  ctx.body = await render('profile/membership.html', ctx.state);
});


function normalizeMemberTier(tier) {
  switch (tier) {
    case "standard":
      return "标准版";
    case "premium":
      return "高级版"
    default:
      return "尚未订阅";
  }
}

function normializeCycle(cycle) {
  switch (cycle) {
    case "year":
      return "/年";
    case "month":
      return "/月";
    default:
      return "";
  }
}

module.exports = router.routes();