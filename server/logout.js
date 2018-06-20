const debug = require('debug')('login:server');
const Router = require('koa-router');

const router = new Router();

router.get('/', async (ctx, next) => {
  ctx.session = null;
  ctx.redirect('/login');
  return;
});

module.exports = router.routes();
