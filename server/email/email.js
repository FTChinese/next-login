const Router = require('koa-router');
const request = require('superagent');
const {dirname} = require('path');
const schema = require('../schema');

const debug = require('../../utils/debug')('user:email');
const endpoints = require('../../utils/endpoints');
const {processJoiError, processApiError, isSuperAgentError} = require('../../utils/errors');

const router = new Router();

router.get('/', async (ctx, next) => {
  const errors = ctx.session.errors;
  const alert = ctx.session.alert;

  const resp = await request.get(endpoints.profile)
  .set('X-User-Id', ctx.session.user.id)

  const profile = resp.body;
  ctx.state.email = {
    current: profile.email,
    new: profile.new
  };
  
  ctx.state.letter = profile.newsletter;

  ctx.state.errors = errors;
  ctx.state.alert = alert;
  
  ctx.body = await render('email.html', ctx.state);

  delete ctx.session.errors;
  delete ctx.session.alert;

});

router.post('/', async (ctx) => {

  const redirectTo = `${dirname(ctx.path)}/account`;

  const result = schema.email.validate(ctx.request.body.account);
  if (result.error) {
    const errors = processJoiError(result.error);

    ctx.session.errors = errors;

    return ctx.redirect(redirectTo);
  }

  /**
   * @type {{email: string}}
   */
  const account = result.value;

  try {
    const resp = await request.patch(endpoints.email)
      .set('X-User-Id', ctx.session.user.id)
      .send(account);

    // If resp.status === 204, the email is not altered
    if (200 === resp.status) {
      debug.info('Email changed')
      ctx.session.alert = {
        email: true
      };
    }
    
    return ctx.redirect(redirectTo);
  } catch (e) {

    const errors = processApiError(e);
    ctx.session.errors = errors;

    return ctx.redirect(redirectTo);
  }
});

router.post('/newsletter', async (ctx, next) => {

  const result = schema.letter.validate(ctx.request.body.letter);

  if (result.error) {
    const errors = processJoiError(result.error);
    ctx.session.errors = errors;
    return ctx.redirect(ctx.path);
  }
  try {

    const resp = await request.patch(endpoints.newsletter)
      .set('X-User-Id', ctx.session.user.id)
      .send(letter);
    
    ctx.session.alert = {
      saved: true
    };

    return ctx.redirect(ctx.path);
  } catch (e) {
    const errors = processApiError(e)
    ctx.session.errors = errors;

    return ctx.redirect(ctx.path);
  }
});

router.post('/request-verification', async (ctx) => {
  const redirectTo = `${dirname(dirname(ctx.path))}/account`;

  try {
    await request.post(endpoints.requestVerification)
      .set('X-User-Id', ctx.session.user.id);

    ctx.session.alert = {
      resent: true
    };

    return ctx.redirect(redirectTo);
  } catch (e) {
    debug.error(e);
    throw e;
  }
});

router.get('/confirm-verification/:token', async (ctx) => {
  const token = ctx.params.token;

  try {
    const resp = await request.put(`${endpoints.verifyEmail}/${token}`)
      .set('X-User-Id', ctx.session.user.id);

    /**
     * @type {User}
     */
    const user = resp.body;
    debug.info("User info after verification: %O", user);

    ctx.session.user.verified = user.verified;

    ctx.redirect('/profile/account');

  } catch (e) {
    if (!isSuperAgentError(e)) {
      throw e;
    }

    if (404 === e.status) {
      debug.info('Verify email respond not found');
      
      ctx.session.alert = {
        invalidLink: true
      }
    }

    ctx.redirect('/profile/account');
  }
});

module.exports = router.routes();