const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:plan');

const render = require('../util/render');
const { nextApi, subsApi } = require("../../lib/endpoints");

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