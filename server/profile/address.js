const debug = require('debug')('user:address');
const Router = require('koa-router');
const request = require('superagent');
const render = require('../../utils/render');
const router = new Router();

router.get('/', async (ctx, next) => {
  ctx.body = await render('profile/address.html', ctx.state);
});

module.exports = router.routes();