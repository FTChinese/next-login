const Router = require('koa-router');
const debug = require('debug')('user:feedback');
const render = require('../util/render');

const router = new Router();

router.get("/", async(ctx, next) => {
  ctx.body = await render("feedback.html", ctx.state);
});

router.post("/", async(ctx, next) => {
  const body = ctx.request.body;

  ctx.body = body;
});

module.exports = router.routes();
