const Router = require('koa-router');
const sitemap = require("../lib/sitemap");

const router = new Router();

router.get('/', async (ctx, next) => {
  ctx.session = null;
  ctx.redirect(sitemap.login);
  return;
});

module.exports = router.routes();
