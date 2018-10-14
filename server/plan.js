const request = require('superagent');
const Router = require('koa-router');
const render = require('../util/render');
const debug = require('../util/debug')('user:plan');
const endpoints = require('../util/endpoints');

const router = new Router();

router.get('/', async (ctx) => {
  ctx.body = await render('signup/plan.html', ctx.state);
});

router.post('/', async (ctx) => {
  const reqBody = ctx.request.body;
  debug.info(reqBody);

  ctx.body = reqBody;
});

module.exports = router.routes()