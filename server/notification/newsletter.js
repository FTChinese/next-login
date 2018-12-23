const request = require('superagent');
const Router = require('koa-router');
const debug = require('debug')('user:email');

const { nextApi } = require("../../lib/endpoints")
const { isAPIError, buildApiError } = require("../../lib/response");

const router = new Router();


// Change newsletter setting
router.post('/newsletter', async (ctx) => {
  const redirectTo = path.resolve(ctx.path, '../');

  const result = schema.newsletter.validate(ctx.request.body.letter);

  if (result.error) {
    ctx.session.errors = processJoiError(result.error);
    return ctx.redirect(redirectTo);
  }

  const newsletter = result.value;
  debug.info('Updating newsletter: %O', newsletter);

  try {

    const userId = ctx.session.user.id;

    await request.patch(endpoints.newsletter)
      .set('X-User-Id', userId)
      .send(newsletter);
    
    ctx.session.alert = buildAlertDone('newsletter');

    return ctx.redirect(redirectTo);

  } catch (e) {
    ctx.session.errors = processApiError(e)

    return ctx.redirect(redirectTo);
  }
});

// Resend verfication letter
router.post('/request-verification', async (ctx) => {
  debug.info("Request verification");

  const redirectTo = path.resolve(ctx.path, '../');

  try {
    const userId = ctx.session.user.id;

    await request.post(endpoints.requestVerification)
      .set('X-User-Id', userId);

    ctx.session.alert = buildAlertDone('letter_sent');

    debug.info("Redirect to %s", redirectTo);

    return ctx.redirect(redirectTo);
  } catch (e) {
    ctx.session.errors = processApiError(e);
    
    return ctx.redirect(redirectTo);
  }
});

module.exports = router.routes();