const debug = require('debug')('user:membership');
const Router = require('koa-router');
const request = require('superagent');
const render = require('../utils/render');
const router = new Router();

router.get('/', async (ctx, next) => {
  ctx.body = await render('profile/membership.html', ctx.state);
});

module.exports = router.routes();