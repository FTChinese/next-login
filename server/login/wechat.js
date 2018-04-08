const Router = require('koa-router');
const router = new Router();
const logger = require('../../utils/logger');

router.get('/', async (ctx, next) => {

});

router.get('/callback', async (ctx, next) => {
  const query = ctx.query;
  logger.info(query);
  ctx.body = query;
});

module.exports = router.routes();