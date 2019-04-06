const Router = require('koa-router');

const router = new Router();

/**
 * @description Handle OAuth redirect request.
 * /authorize?response_type=code&client_id=xxxx&redirect_uri=xxx&state=xxx
 */
router.get('/', async (ctx, next) => {
  
});

module.exports = router.routes();
