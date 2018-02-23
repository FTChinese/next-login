const debug = require('debug')('login:server');
const Router = require('koa-router');

const router = new Router();

router.get('/', async (ctx, next) => {
  ctx.body = 'user account';
});

module.exports = router.routes();