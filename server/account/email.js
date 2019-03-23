const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:name');

const {
  nextApi
} = require("../../model/endpoints")
const {
  sitemap
} = require("../../model/sitemap");
const {
  isAPIError
} = require("../../lib/response");
const {
  AccountValidtor
} = require("../../lib/validate");
const {
  FtcUser,
} = require("../../model/account");

const router = new Router();

/**
 * @description Submit new email
 * /user/account/email
 */
router.post('/', async (ctx) => {

  /**
   * @type {{currentEmail: string, email: string}}
   */
  const account = ctx.request.body.account;

  /**
   * @type {{email: string} | null}
   */
  const {
    result,
    errors
  } = new AccountValidtor(account)
    .validateEmail()
    .validateEmailUpdate()
    .end();

  if (errors) {
    ctx.session.errors = errors;
    ctx.session.account = {
      email: account.email,
    };

    return ctx.redirect(sitemap.account);
  }

  try {
    const userId = ctx.session.user.id;

    await request.patch(nextApi.email)
      .set('X-User-Id', userId)
      .send(result);

    ctx.session.alert = {
      key: "email_changed",
    };

    return ctx.redirect(sitemap.account);
  } catch (e) {

    ctx.session.account = {
      email: account.email,
    };

    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.session.errors = {
        message: e.message,
      };

      return ctx.redirect(sitemap.account);
    }

    /**
     * @type {{message: string, error: Object}}
     */
    ctx.session.apiErr = e.response.body;

    return ctx.redirect(sitemap.account);
  }
});

module.exports = router.routes();
