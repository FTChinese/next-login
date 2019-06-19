const Router = require('koa-router');
const debug = require("debug")('user:binding');
const render = require("../../util/render");
const Account = require("../../lib/account");

const {
  sitemap
} = require("../../lib/sitemap");

const {
  errMessage,
  ClientError,
} = require("../../lib/response");

const router = new Router();

router.get("/", async(ctx, next) => {
  /**
   * @type {Account}
   */
  const account = ctx.state.user;
  if (!account.isLinked()) {
    ctx.status = 404;
    return;
  }

  ctx.body = await render("account/unlink.html", ctx.state);
});

router.post("/", async(ctx, next) => {
  /**
   * @type {Account}
   */
  const account = ctx.state.user;
  if (!account.isLinked()) {
    ctx.status = 404;
    return;
  }

  /**
   * @type {string}
   */
  const anchor = ctx.request.body.anchor
    ? ctx.request.body.anchor
    : null;

  if (account.isMember() && !anchor) {
    ctx.state.errors = {
      anchor: "当前账号拥有是FT会员，解除绑定必须选择会员保留在哪个账号上"
    }

    return await next();
  }

  try {
    await account.unlink(anchor);

    ctx.redirect(sitemap.account);
  } catch (e) {
    const clientErr = new ClientError(e);

    if (!clientErr.isFromAPI()) {
      throw e;
    }

    switch (e.status) {
      case 404:
        ctx.state.errors = {
          message: "没有找到您的账号"
        };
        break;
      default:
        ctx.state.errors = clientErr.buildFormError()
        break;
    }

    return await next();
  }
}, async(ctx, next) => {
  ctx.body = await render("account/unlink.html", ctx.state);
});

module.exports = router.routes();
