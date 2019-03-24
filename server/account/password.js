const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:password');
const render = require('../../util/render');
const {
  nextApi
} = require("../../model/endpoints")
const {
  sitemap
} = require("../../model/sitemap");
const {
  isAPIError,
  buildErrMsg,
  buildApiError,
  errMessage
} = require("../../lib/response");
const {
  AccountValidtor
} = require("../../lib/validate");
const {
  FtcUser,
} = require("../../model/request");

const router = new Router();

/**
 * @description Show change password page
 * /user/account/password
 */
router.get("/", async (ctx, next) => {
  ctx.body = await render("account/password.html", ctx.state);
});

/**
 * @description Submit new password
 * /user/account/password
 */
router.post('/', async (ctx, next) => {
  const account = ctx.request.body;

  /**
   * @type {{oldPassword: string, password: string, confirmPassword: string}}
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
    ctx.state.errors = errors;

    return await next();
  }

  try {
    
    await new FtcUser(ctx.session.user.id)
      .updatePassword({
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
      ctx.state.errors = buildErrMsg

      return await next();
    }

    switch (e.status) {
      /**
       * 403 error could only be converted to human readable message here.
       */
      case 403:
        ctx.state.errors = {
          oldPassword: errMessage.password_forbidden,
        };
        break;

      default:
        ctx.state.errors = buildApiError(e.response.body);
        break;
    }

    return await next();
  }
}, async (ctx) => {
  ctx.body = await render("account/password.html", ctx.state);
});

module.exports = router.routes();
