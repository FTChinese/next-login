const Router = require('koa-router');
const request = require('superagent');
const path = require('path');
const schema = require('./schema');

const debug = require('../util/debug')('user:email');
const endpoints = require('../util/endpoints');
const {processJoiError, processApiError, isSuperAgentError, buildAlertDone} = require('../util/errors');
const render = require('../util/render');

const router = new Router();

// Show email setting page
router.get('/', async (ctx, next) => {

  const userId = ctx.session.user.id;

  const resp = await request.get(endpoints.profile)
    .set('X-User-Id', userId);

  const profile = resp.body;

  // Set email
  ctx.state.account = {
    email: profile.email,
    oldEmail: profile.email
  };
  // Set newsletter
  ctx.state.letter = profile.newsletter;

  // Check redirect message
  if (ctx.session.errors) {
    ctx.state.errors = ctx.session.errors;
  }

  if (ctx.session.alert) {
    ctx.state.alert = ctx.session.alert;
  }
  
  ctx.body = await render('email.html', ctx.state);

  delete ctx.session.errors;
  delete ctx.session.alert;
});

// Submit new email
router.post('/', async (ctx) => {

  const result = schema.changeEmail.validate(ctx.request.body.account);
  if (result.error) {
    const errors = processJoiError(result.error);

    ctx.session.errors = errors;

    return ctx.redirect(ctx.path);
  }

  /**
   * @type {{oldEmail: string, email: string}}
   */
  const account = result.value;

  // If email is not changed, do nothing.
  if (account.oldEmail === account.email) {
    debug.info('Email is not altered.');
    return ctx.redirect(ctx.path);
  }

  try {
    const userId = ctx.session.user.id;

    const resp = await request.patch(endpoints.email)
      .set('X-User-Id', userId)
      .send({email: account.email});

    // If resp.status === 204, the email is not altered
    // If email is actually changed, updated user data will be sent back.
    if (200 === resp.status) {
      debug.info('Email changed')
      ctx.session.alert = buildAlertDone('email');
    }
    
    return ctx.redirect(redirectTo);
  } catch (e) {

    const errors = processApiError(e);
    ctx.session.errors = errors;

    return ctx.redirect(redirectTo);
  }
});

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