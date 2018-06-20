const request = require('superagent');
const Router = require('koa-router');
const render = require('../utils/render');
const debug = require('../utils/debug')('user:plan');
const endpoints = require('../utils/endpoints');

const router = new Router();

router.get('/', async (ctx) => {
  ctx.body = await render('new-user/plan.html', ctx.state);
});

router.post('/', async (ctx) => {
  const reqBody = ctx.request.body;
  debug.info(reqBody);

  ctx.body = reqBody;
});

module.exports = router.routes()