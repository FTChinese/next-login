const request = require('superagent');
const Router = require('koa-router');
const schema = require('./schema');

const debug = require('../util/debug')('user:profile');
const endpoints = require('../util/endpoints');
const {processJoiError, processApiError, buildAlertDone} = require('../util/errors');
const render = require('../util/render');

const router = new Router();

// Show profile page
router.get('/', async (ctx) => {

  const resp = await request.get(endpoints.profile)
    .set('X-User-Id', ctx.session.user.id);

  console.log('User profile: %o', resp.body);

  /**
   * @type {Profile}
   */
  const profile = resp.body;
  ctx.state.profile = profile;

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
router.post('/', async (ctx) => {

  const result = schema.profile.validate(ctx.request.body.profile, {abortEarly: false});

  if (result.error) {
    ctx.session.errors = processJoiError(result.error);
    
    return ctx.redirect(ctx.path);
  }

  /**
   * @type {{familyName: string, givenName: string, gender: string, birthdate: string}}
   */
  const profile = result.value;

  try {
    await request.patch(endpoints.profile)
      .set('X-User-Id', ctx.session.user.id)
      .send(profile);

    ctx.session.alert = buildAlertDone('profile_saved');

    return ctx.redirect(ctx.path);
  } catch (e) {
    ctx.session.errors = processApiError(e);

    return ctx.redirect(ctx.path);
  }
});

module.exports = router.routes();