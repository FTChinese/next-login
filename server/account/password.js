const Router = require('koa-router');
const debug = require("debug")('user:password');
const render = require('../../util/render');
const {
  sitemap
} = require("../../lib/sitemap");
const {
  errMessage,
  ClientError
} = require("../../lib/response");
const FtcUser = require("../../lib/ftc-user");
const {
  validatePasswordUpdate
} = require("../schema");

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
  /**
   * @type {{oldPassword: string, password: string, confirmPassword: string}}
   */
  const passwords = ctx.request.body;

  const { value, errors } = validatePasswordUpdate(passwords);

  if (errors) {
    ctx.state.errors = errors;

    return await next();
  }

  if (value.password != value.confirmPassword) {
    ctx.state.errors = {
      confirmPassword: errMessage.passwords_mismatched,
    }

    return await next();
  }

  try {
    
    await new FtcUser(ctx.session.user.id)
      .updatePassword({
        oldPassword: value.oldPassword,
        newPassword: value.password,
      });

    ctx.session.alert = {
      key: "password_saved"
    };

    return ctx.redirect(sitemap.account);

  } catch (e) {

    const clientErr = new ClientError(e);

    if (!clientErr.isFromAPI) {
      throw e;
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
        ctx.state.errors = clientErr.buildAPIError();
        break;
    }

    return await next();
  }
}, async (ctx) => {
  ctx.body = await render("account/password.html", ctx.state);
});

module.exports = router.routes();
