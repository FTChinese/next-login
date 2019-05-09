const debug = require("debug")("user:pay-result");
const Router = require("koa-router");
const render = require("../../util/render");
const Account = require("../../lib/account");

const router = new Router();

router.get("/ali", async(ctx, next) => {
  debug("Session subs: %O", ctx.session.subs);
  
  ctx.body = ctx.query;
});

router.get("/wx", async(ctx, next) => {

});

module.exports = router.routes();
