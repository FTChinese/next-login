const request = require('superagent');
const Joi = require('joi');
const schema = require('../schema');
const debug = require('../../utils/debug')('user:enter-email');
const render = require('../../utils/render');

module.exports = async (ctx, next) => {
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
}