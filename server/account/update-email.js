const Router = require('koa-router');
const debug = require("debug")('user:name');
const render = require('../../util/render');
const {
  sitemap
} = require("../../lib/sitemap");
const {
  ClientError,
} = require("../../lib/response");
const FtcUser = require("../../lib/ftc-user");
const Account = require("../../lib/account");
const {
  invalidMessage,
  validateEmail,
} = require("../schema");

const router = new Router();

/**
 * @description Show email update page.
 * /user/account/email
 */
router.get("/", async (ctx) => {

  /**
   * @type {Account}
   */
  const account = ctx.state.user;

  if (account.isWxOnly()) {
    ctx.status = 404;
  }

  const acntData = await account.fetch();

  ctx.state.email = acntData.email;

  ctx.body = await render("account/update-email.html", ctx.state);
});

/**
 * @description Submit new email
 * /user/account/email
 */
router.post('/', async (ctx, next) => {
  /**
   * @type {Account}
   */
  const account = ctx.state.user;

  /**
   * @type {string}
   */
  const email = ctx.request.body.email;

  const { value, errors } = validateEmail(email);
  if (errors) {
    ctx.state.errors = errors;
    ctx.state.email = value.email;

    return await next();
  }

  if (email == account.email) {
    ctx.state.errors = {
      email: invalidMessage.staleEmail,
    }
    ctx.state.email = value.email;

    return await next();
  }

  try {
    await new FtcUser(ctx.session.user.id)
      .updateEmail(value);

    // Pass data upon redirect.
    ctx.session.alert = {
      key: "email_changed",
    };

    return ctx.redirect(sitemap.account);
  } catch (e) {

    ctx.state.email = value.email;

    const clientErr = new ClientError(e)

    if (!clientErr.isFromAPI()) {
      throw e;
    }

    ctx.state.errors = clientErr.buildApiError();

    return await next();
  }
}, async (ctx) => {
  ctx.body = await render("account/update-email.html", ctx.state);
});

module.exports = router.routes();
