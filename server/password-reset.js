const debug = require('debug')('user:password-reset');
const {dirname} = require('path');
const Router = require('koa-router');
const request = require('superagent');
const Joi = require('joi');
const schema = require('./schema');
const render = require('../utils/render');
const sendEmail = require('../utils/send-email');
const reset = require('../utils/reset-password');

const router = new Router();

/**
 * @description Ask user to enter email
 */
router.get('/', async (ctx, next) => {
  /**
   * @type {{invalidLink: boolean, emailSent: boolean, pwReset: true}}
   */
  const invalidLink = ctx.session.invalidLink;
  if (invalidLink) {
    ctx.state.errors = {
      invalidLink
    };
  }
  ctx.body = await render('password/reset-email.html', ctx.state);

  delete ctx.session.invalidLink;
});

/**
 * @description Collection user entered email and send email to it.
 */
router.post('/', async (ctx, next) => {
  /**
   * @type {{email: string}}
   */
  const body = ctx.request.body;

  debug('Body: %O', body);

  try {

    /**
     * @type {{email: string}}
     */
    const validated = await Joi.validate(body, schema.email);

    debug('Input validated: %O', validated);

    const resp = await request.get(`http://localhost:8000/is-taken?email=${validated.email}`)
      .auth(ctx.accessData.access_token, {type: 'bearer'})

    debug('Get response from api');

    // Generate a code
    const code = await reset.generateCode();
    debug('Reset email code: %s', code);

    const address = validated.email;

    // Send email
    const info = await reset.sendEmail({
      address,
      name: '',
      code
    });
    debug('Email sent: %s', info.messageId);

    // Store the code and email
    reset.store({code, address});

    ctx.session.emailSent = true;
    
    return ctx.redirect(ctx.path);

  } catch (e) {
    const joiErrs = schema.gatherErrors(e);
    if (joiErrs) {
      debug('Joi errors: %O', joiErrs);
      ctx.state.errors = joiErrs;
      return await next();
    }

    if (404 === e.status) {
      debug('Not found');
      ctx.state.errors = {
        notFound: body.email.trim()
      };
      return await next();
    }

    throw e
  }
}, async (ctx, next) => {
  ctx.body = await render('password/reset-email.html', ctx.state);
});

/**
 * @description User clicked reset password link in email and get here.
 */
router.get('/:code', async (ctx, next) => {
  // if code is invalid, redirect to `/password-reset`
  // Query database, find out which email this code is linked to.
  const code = ctx.params.code;
  const address = await reset.load(code);

  // If code cannot be found, redirect to /passwrod-reset with error message.
  if (!address) {
    ctx.session.invalidLink = true;
    const redirectTo = dirname(ctx.path);
    return ctx.redirect(redirectTo);
  }

  ctx.state.email = address;
  ctx.body = await render('password/reset-form.html', ctx.state);
});

/**
 * @description Collection user entered password and perform update. After success redirect to /password-reset with success flag.
 */
router.post('/:code', async (ctx, next) => {
  const code = ctx.params.code;
  /**
   * @type {{password: string, passwordConfirmation: string}}
   */
  const body = ctx.request.body;
  debug('Password: %O', body);

  // Try to find this user's email. Same logic as GET.
  const email = await reset.load(code);

  if (!email) {
    ctx.session.invalidLink = true;
    const redirectTo = dirname(ctx.path);
    return ctx.redirect(redirectTo);
  }

  try {
    const pw = await Joi.validate(body, schema.reset);

    if (pw.password !== pw.passwordConfirmation) {
      ctx.session.pwMismatch = true;
      return ctx.redirect(ctx.path);
    }

    // 204 if updated successfully
    // 422 if posted json is incomplete
    // 400 otherwise
    const resp = await request.post(`http://localhost:8000/password-reset`)
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send({email, password: pw.password});

    debug('API success reponse: %O', resp.noContent);

    ctx.session.pwReset = true;
    return ctx.redirect(dirname(ctx.path));

  } catch (e) {
    const joiErrs = schema.gatherErrors(e);
    if (joiErrs) {
      debug('Joi errors: %O', joiErrs);
      ctx.state.errors = joiErrs;
      ctx.session.pwInvalid = true;
      return ctx.redirect(ctx.path);
    }

    throw e
  }
});



module.exports = router.routes();
