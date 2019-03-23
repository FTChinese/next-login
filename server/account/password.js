const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:password');

const {
  nextApi
} = require("../../model/endpoints")
const {
  sitemap
} = require("../../model/sitemap");
const {
  isAPIError,
  buildApiError,
  errMessage
} = require("../../lib/response");
const {
  AccountValidtor
} = require("../../lib/validate");

const router = new Router();

/**
 * @description Submit new password
 * /user/account/password
 */
router.post('/', async (ctx, next) => {
  const account = ctx.request.body;

  /**
   * @type {{password: string, oldPassword: string} | null}
   */
  const {
    result,
    errors
  } = new AccountValidtor(account)
    .validatePassword()
    .confirmPassword()
    .validateOldPassword()
    .end();

  if (errors) {
    ctx.session.errors = errors;

    return ctx.redirect(sitemap.account);
  }

  try {
    const userId = ctx.session.user.id;

    await request.patch(nextApi.password)
      .set('X-User-Id', userId)
      .send({
        oldPassword: result.oldPassword,
        newPassword: result.password,
      });

    ctx.session.alert = {
      key: "password_saved"
    };

    return ctx.redirect(sitemap.account);

  } catch (e) {

    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.session.errors = {
        message: e.message
      };

      return ctx.redirect(sitemap.account);
    }

    switch (e.status) {
      /**
       * 403 error could only be converted to human readable message here.
       */
      case 403:
        ctx.session.errors = {
          oldPassword: errMessage.password_forbidden,
        };
        break;

      default:
        /**
         * @type {{message: string, error: Object}}
         */
        ctx.session.apiErr = e.response.body;
        break;
    }

    return ctx.redirect(sitemap.account);
  }
});

module.exports = router.routes();
