const Router = require('koa-router');
const parser = require("ua-parser-js");
const MobileDetect = require("mobile-detect");

const router = new Router();

router.get('/ua', async (ctx, next) => {
  ctx.body = parser(ctx.header["user-agent"]);
  const md = new MobileDetect(ctx.header["user-agent"]);

  console.log(`Is mobile: ${!!md.mobile()}`);
});

module.exports = router.routes();
