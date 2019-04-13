const Router = require('koa-router');
const debug = require("debug")('user:name');
const render = require('../../util/render');
const {
  sitemap
} = require("../../lib/sitemap");
const {
  isAPIError,
  buildErrMsg,
  buildApiError,
} = require("../../lib/response");
const {
  AccountValidtor
} = require("../../lib/validate");
const FtcUser = require("../../lib/ftc-user");
const Account = require("../../lib/account");

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

  const acntData = await account.refreshAccount();

  ctx.state.account = acntData;

  ctx.body = await render("account/email.html", ctx.state);
});

/**
 * @description Submit new email
 * /user/account/email
 */
router.post('/', async (ctx, next) => {

  /**
   * @type {{email: string}}
   */
  const account = ctx.request.body.account;

  /**
   * @type {{email: string}}
   */
  const {
    result,
    errors
  } = new AccountValidtor({
      email: account.email,
      currentEmail: ctx.session.user.email,
    })
    .validateEmail()
    .validateEmailUpdate()
    .end();

  if (errors) {
    ctx.state.errors = errors;
    ctx.state.account = account;

    return await next();
  }

  try {
    await new FtcUser(ctx.session.user.id)
      .updateEmail(result);

    // Pass data upon redirect.
    ctx.session.alert = {
      key: "email_changed",
    };

    return ctx.redirect(sitemap.account);
  } catch (e) {

    ctx.state.account = account

    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.state.errors = buildErrMsg(e);

      return await next();
    }

    const body = e.response.body;
    debug("API error response: %O", body);

    ctx.state.errors = buildApiError(body);

    return await next();
  }
}, async (ctx) => {
  ctx.body = await render("account/email.html", ctx.state);
});

module.exports = router.routes();
