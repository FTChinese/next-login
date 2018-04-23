const request = require('superagent');
const Joi = require('joi');
const schema = require('../schema');
const debug = require('../../utils/debug')('user:reset-password');
const render = require('../../utils/render');

/**
 * @description User submitted new password
 */
exports.do = async (ctx, next) => {
  const token = ctx.params.code;
  /**
   * @type {{password: string, passwordConfirmation: string}}
   */
  const body = ctx.request.body;
  debug.info('Password: %O', body);
  let pw;
  try {
    pw = await Joi.validate(body, schema.reset);

    // If confirmed password is insistent with password, redisplay this page with error message.
    if (pw.password !== pw.passwordConfirmation) {
      ctx.state.errors = {
        pwMismatch: true
      };
      return await next();
    }
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

  try {
    /**
     * Post {token: token, password: newPassword} to API.
     * API will again check if the token exists, is used, or is expired.
     */
    const resp = await request.post(`http://localhost:8000/password/reset`)
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send({
        token,
        password: pw.password
      });

    debug('API success reponse: %O', resp.noContent);
    
    ctx.session.success = {
      pwReset: true
    };

    // Redirect to /password-reset to prevent user refresh.
    return ctx.redirect(dirname(ctx.path));

  } catch (e) {
    debug.error(e);
    // if this is not a superagent error
    if (!e.response) {
      throw e;
    }

    // If the token does not exist, redirect to /password-reset page, tell the user link is invalid and ask user to resend email
    if (404 === e.status) {
      ctx.session.invalidLink = true;

      // Redirect to /password-reset
      const redirectTo = dirname(ctx.path);

      debug.info('Token %s not found. Redirect to %s', token, redirectTo);

      return ctx.redirect(redirectTo);
    }

    // Display API error for now.
    ctx.body = e.response.body;
  }
};

exports.showErrors = async function(ctx) {
  ctx.body = await render('password/new-password.html', ctx.state);
}