const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:account');
const render = require('../../util/render');
const {
  sitemap
} = require("../../lib/sitemap");
const {
  nextApi
} = require("../../lib/endpoints")
const {
  isAPIError,
  buildApiError
} = require("../../lib/response");

const router = new Router();

// Show newsletter setting page
router.get('/', async (ctx, next) => {

  const userId = ctx.session.user.id;

  const resp = await request.get(nextApi.newsletter)
    .set('X-User-Id', userId);

  /**
   * @type {{todayFocus: boolean, weeklyChoice: boolean, afternoonExpress: boolean}}
   */
  const newsletter = resp.body;

  // Set newsletter
  ctx.state.letter = newsletter;

  // Check redirect message
  if (ctx.session.errors) {
    ctx.state.errors = ctx.session.errors;
  }

  if (ctx.session.alert) {
    ctx.state.alert = ctx.session.alert;
  }

  ctx.body = await render('notification.html', ctx.state);

  delete ctx.session.errors;
  delete ctx.session.alert;
});

// Change newsletter setting
router.post('/newsletter', async (ctx) => {

  const result = schema.newsletter.validate(ctx.request.body.letter);

  if (result.error) {
    ctx.session.errors = processJoiError(result.error);
    return ctx.redirect(sitemap.notification);
  }

  const newsletter = result.value;
  debug.info('Updating newsletter: %O', newsletter);

  try {

    const userId = ctx.session.user.id;

    await request.patch(endpoints.newsletter)
      .set('X-User-Id', userId)
      .send(newsletter);

    ctx.session.alert = buildAlertDone('newsletter');

    return ctx.redirect(sitemap.notification);

  } catch (e) {
    ctx.session.errors = processApiError(e)

    return ctx.redirect(redirectTo);
  }
});

module.exports = router.routes();
