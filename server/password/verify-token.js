const {dirname} = require('path')
const request = require('superagent');
const debug = require('../../utils/debug')('user:verify-rest-token');
const render = require('../../utils/render');

/**
 * @description User clicked link in password reset email and get here: /password-reset/:token.
 * NOTE: The token can only be used once.
 */
module.exports = async function (ctx, next) {
  const token = ctx.params.code;

  try {
    // Get the email associated with the token.
    // Response 404 Not Found if the token does not exist, is used, or is expired.
    // 200 OK with body {email: "email-address"}
    const resp = await request.get(`http://localhost:8000/users/password/verify/${token}`)
        .auth(ctx.accessData.access_token, {type: 'bearer'});

    // If the email for `code` is found, show user the form to enter new password two times.
    ctx.state.email = address;
    ctx.body = await render('password/new-password.html', ctx.state);

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

      debug.info('Email associated with token %s not found. Redirect to %s', token, redirectTo);

      return ctx.redirect(redirectTo);
    }

    // Display API error for now.
    ctx.body = e.response.body;
  }
}