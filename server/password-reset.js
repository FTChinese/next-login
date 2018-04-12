const debug = require('debug')('user:password-reset');
const _ = require('lodash')
const {dirname} = require('path');
const Router = require('koa-router');
const request = require('superagent');
const Joi = require('joi');
const schema = require('./schema');
const render = require('../utils/render');
const reset = require('../utils/reset-password');

const router = new Router();

/**
 * @description Ask user to enter email
 * ctx.session could have one of those:
 * {
 *  errors: {
 *    invliadLink: true 
 *  },
 *  success: {
 *    emailSent: true,
 *    pwReset: true
 *  }
 * }
 */
router.get('/', async (ctx, next) => {
  /**
   * @type {{emailSent: boolean, pwReset: boolean}}
   */
  const success = ctx.session.success;

  if (!_.isEmpty(success)) {
    ctx.state.success = success;
    ctx.body = await render('password/success.html', ctx.state);

    delete ctx.session.success;
    return;
  }

  /**
   * @type {boolean}
   */
  const invalidLink = ctx.session.invalidLink;
  if (invalidLink) {
    ctx.state.errors = {
      invalidLink
    };
  }
  ctx.body = await render('password/enter-email.html', ctx.state);

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

    // We might need to set up a dedicated service to send emails.
    // Request to API for reset code.
    // Ask the email service to send email.
    
    // check whether this email exists.
    // POST to API /users/password-reset
    const resp = await request.get(`http://localhost:8000/is-taken?email=${validated.email}`)
      .auth(ctx.accessData.access_token, {type: 'bearer'});

    debug('API response: email exists');

    // Generate a code
    const code = await reset.generateCode();
    debug('Reset email code: %s', code);

    const address = validated.email;

    // Send email
    const info = await reset.sendEmail({
      address,
      name: '',
      code,
      host: ctx.host
    });
    debug('Email sent: %s', info.messageId);

    // Store the code and email
    reset.store({code, address});

    // Redirect back to the above router to prevent user pressing refresh button and resubmit the data.
    ctx.session.success = {
      emailSent: true
    };
    return ctx.redirect(ctx.path);

  } catch (e) {
    
    // If there are validation error, or the email is not found, redisplay the page.
    const joiErrs = schema.gatherErrors(e);
    if (joiErrs) {
      debug('Joi errors: %O', joiErrs);
      ctx.state.errors = joiErrs;
      return await next();
    }

    if (404 === e.status) {
      debug('Not found');
      const email = body.email.trim();
      
      // Make user entered data stikcy
      ctx.state.email = email;

      ctx.state.errors = {
        notFound: email
      };
      return await next();
    }

    throw e
  }
}, async (ctx, next) => {
  ctx.body = await render('password/enter-email.html', ctx.state);
});

/**
 * @description User clicked reset password link in email and get here.
 */
router.get('/:code', async (ctx, next) => {
  // if code is invalid, redirect to `/password-reset`
  // Query database, find out which email this code is linked to.
  const code = ctx.params.code;
  const address = await reset.load(code);

  // If `code` cannot be found, redirect to /passwrod-reset with error message and ask user to enter email.
  if (!address) {
    ctx.session.invalidLink = true;
    const redirectTo = dirname(ctx.path);
    return ctx.redirect(redirectTo);
  }

  // If the email for `code` is found, show user the form the enter new password two times.
  ctx.state.email = address;
  ctx.body = await render('password/new-password.html', ctx.state);
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

  // If email is not found
  if (!email) {
    ctx.session.invalidLink = true;
    const redirectTo = dirname(ctx.path);
    return ctx.redirect(redirectTo);
  }

  try {
    const pw = await Joi.validate(body, schema.reset);

    // If confirmed password is insistent with password, redisplay this page with error message.
    if (pw.password !== pw.passwordConfirmation) {
      ctx.state.errors = {
        pwMismatch: true
      };
      return await next();
    }

    // 204 if updated successfully
    // 422 if posted json is incomplete
    // 400 otherwise
    const resp = await request.post(`http://localhost:8000/password-reset`)
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send({email, password: pw.password});

    debug('API success reponse: %O', resp.noContent);

    // If password reset successfully, delete this `code` and show a password reset successful page.
    await reset.delete(code);
    debug('Deleted key: %s', code);
    
    ctx.session.success = {
      pwReset: true
    };
    return ctx.redirect(dirname(ctx.path));

  } catch (e) {
    const joiErrs = schema.gatherErrors(e);
    // If there are Joi errors, redisplay this page with errors.
    if (joiErrs) {
      debug('Joi errors: %O', joiErrs);
      ctx.state.errors = {
        pwInvalid: true
      };
      return await next();
    }

    throw e;
  }
}, async (ctx, next) => {
  // This is used to display error message only.
  ctx.body = await render('password/new-password.html', ctx.state);
});



module.exports = router.routes();
