const Router = require('koa-router');
const debug = require("debug")('user:verification');

const render = require('../../util/render');
const {
  isAPIError,
  buildApiError,
  errMessage
} = require("../../lib/response");
const {
  Verification,
} = require("../../model/request");

const router = new Router();

/**
 * @description Verify email
 * /user/verify/email/:token
 */
router.get('/:token', async (ctx) => {
  const token = ctx.params.token;
  debug("Email token: %s", token);

  try {

    await new Verification(token).email()

    // Update verification status if session exists
    if (ctx.session.user) {
      debug('Update session data after email verified');
      ctx.session.user.isVerified = true;
    }

    ctx.state.success = true;
    ctx.body = await render('verification/email.html', ctx.state);

  } catch (e) {
    // Here using `warning` because it might be better to show message in the content body rather than in the top banner since this page is nearly blank.
    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.state.warning = e.message;

      return await next();
    }

    /**
     * @type {{message: string, error: Object}}
     */
    const body = e.response.body;

    switch (e.status) {
      case 404:
        ctx.state.errors = errMessage.email_token_not_found;
        break;

        // 400
      default:
        ctx.state.errors = buildApiError(body);
        break;
    }

    ctx.body = await render('verification/email.html', ctx.state);
  }
});

module.exports = router.routes();
