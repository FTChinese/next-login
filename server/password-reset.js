const Router = require('koa-router');
const _ = require('lodash');
const path = require('path');
const request = require('superagent');
const schema = require('./schema');

const render = require('../utils/render');
const debug = require('../utils/debug')('user:password-reset');
const {processJoiError, processApiError, buildInvalidField, buildAlertDone} = require('../utils/errors');
const endpoints = require('../utils/endpoints');

const router = new Router();

// Ask user to enter email
// This url is used to render different templates under different conditions.
// Initially the page shows an input box so that user could enter email
// After a password reset letter is sent to the user, the input box is hidden and a success message is shown;
// After password is reset, the input box is hidden and another success message is shown.
router.get('/', async (ctx) => {
  /**
   * @type {{letter: boolean, reset: boolean}}
   */
  const alert = ctx.session.alert;

  /**
   * This part is enabled only after email is sent or password is reset.
   */
  if (!_.isEmpty(alert)) {
    ctx.state.alert = alert;
    ctx.body = await render('password/success.html', ctx.state);

    delete ctx.session.alert;
    return;
  }

  // Handle invalid token for password reset.
  if (ctx.session.errors) {
    ctx.state.errors = ctx.session.errors;
  }
  
  ctx.body = await render('password/enter-email.html', ctx.state);

  delete ctx.state.errors;
});

// Collect user entered email, check if email is valid, and send letter.
router.post('/', async function (ctx, next) {

  const result = schema.email.validate(ctx.request.body);
  if (result.error) {
    ctx.state.errors = processJoiError(result.error)
    
    ctx.state.email = result.value.email;

    return await next();
  }

  const email = result.value.email;

  try {    
    // Ask API to sent email.
    await request.post(endpoints.resetLetter)
      .send({email});

    // Tell redirected page what message to show.
    ctx.session.alert = buildAlertDone('letter_sent');

    // Redirect to /password-reset
    return ctx.redirect(ctx.path);

  } catch (e) {
    // 400, 422, 404
    ctx.state.errors = processApiError(e, 'email');
    ctx.state.email = email;

    return await next();
  }
}, async (ctx) => {
  ctx.body = await render('password/enter-email.html', ctx.state);
});

// Verify password reset token and show reset password page.
// API response has only two results: 200 or 404
router.get('/:token', async (ctx) => {
  const token = ctx.params.token;

  try {
    const resp = await request.get(`${endpoints.verifyResetToken}/${token}`);

    /**
     * User is found and show page to enter new password
     * @type {User}
     */
    const user = resp.body;
    ctx.state.email = user.email;

    return ctx.body = await render('password/new-password.html', ctx.state);

  } catch (e) {
    // 400
    // 404 if the token is not found, the the user associated with the token is not found.
    ctx.session.errors = processApiError(e, 'password_token');

    ctx.redirect(path.resolve(ctx.path, '../'));
  }
});

// User submit new password
router.post('/:token', async (ctx, next) => {
  const token = ctx.params.token;
  const redirectTo = path.resolve(ctx.path, '../');

  const result = schema.reset.validate(ctx.request.body);

  if (result.error) {
    ctx.state.errors = processJoiError(result.error);

    return await next();
  }
  
  /**
   * @type {{password: string, confirmPassword: string}}
   */
  const pws = result.value

  // Check if the password equals confirmed one
  if (pws.password !== pws.confirmPassword) {
    ctx.state.errors = buildInvalidField('confirmPassword', 'mismatched');

    return await next();
  }

  try {

    await request.post(endpoints.passwordReset)
      .send({
        token,
        password: pws.password
      });
    
    ctx.session.alert = buildAlertDone('password_reset');

    // Redirect to /password-reset to prevent user refresh.
    return ctx.redirect(redirectTo);

  } catch (e) {
    // 400, 422
    // 404 here means the token is invalid or expired. Handle it separatedly.
    if (404 === e.status) {
      ctx.session.errors = buildInvalidField('password_reset', 'forbidden');
      return ctx.redirect(redirectTo);
    }

    ctx.state.errors = processApiError(e);
    return await next();
  }
}, async function(ctx) {
  ctx.body = await render('password/new-password.html', ctx.state);
});

module.exports = router.routes();