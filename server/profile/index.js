const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:profile');
const render = require('../util/render');
const { nextApi } = require("../../lib/endpoints")
const { isAPIError, buildApiError } = require("../../lib/response");
const { ProfileValidator } = require("../../lib/validate");

const userName = require("./user-name");
const mobileNumber = require("./moble-number");

const router = new Router();

// Show profile page
router.get('/', async (ctx) => {

  const userId = ctx.session.user.id;

  const resp = await request.get(nextApi.profile)
    .set('X-User-Id', userId);

  /**
   * @type {Profile}
   */
  const profile = resp.body;
  ctx.state.profile = ctx.session.profile
    ? Object.assign(profile, ctx.session.profile)
    : profile;

  if (ctx.session.alert) {
    ctx.state.alert = ctx.session.alert;
  }
  
  if (ctx.session.errors) {
    ctx.state.errors = ctx.session.errors;
  }

  ctx.body = await render('profile/home.html', ctx.state);

  delete ctx.session.alert;
  delete ctx.session.errors;
});

// Update profile
router.post('/', async (ctx, next) => {

  const profile = ctx.request.body.profile;
  const { result, errors } = new ProfileValidator(profile)
    .familyName()
    .givenName()
    .gender()
    .birthdate()
    .end();

  if (errors) {
    ctx.session.errors = processJoiError(result.error);

    ctx.state.errors = errors;
    ctx.state.profile = profile;
    return await next();
  }

  try {
    const userId = ctx.session.user.id;
    await request.patch(nextApi.profile)
      .set('X-User-Id', userId)
      .send(result);

    ctx.session.alert = {
      done: "profile_saved"
    };

    return ctx.redirect(ctx.path);
  } catch (e) {

    ctx.state.profile = profile;

    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.state.errors = {
        server: e.message,
      };

      return await next();
    }

    /**
     * @type {{message: string, error: Object}}
     */
    const body = e.response.body;

    ctx.state.errors = buildApiError(body);

    return await next();
  }
}, async (ctx) => {

  const userId = ctx.session.user.id;

  const resp = await request.get(nextApi.profile)
    .set('X-User-Id', userId);

  /**
   * @type {Profile}
   */
  const profile = resp.body;
  ctx.state.profile = Object.assign(
    profile,
    ctx.state.profile,
  );

  ctx.body = await render('profile/home.html', ctx.state);
});

router.use("/name", userName);
router.use("/mobile", mobileNumber)

module.exports = router.routes();