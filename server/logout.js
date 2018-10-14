const debug = require('../util/debug')('login:server');
const Router = require('koa-router');

const router = new Router();

router.get('/', async (ctx, next) => {
  ctx.session = null;
  const redirectTo = ctx.state.sitemap.login;
  debug.info('Logout. Redirect to: %s', redirectTo);
  ctx.redirect(redirectTo);
  return;
});

module.exports = router.routes();
