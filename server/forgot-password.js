const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:password-reset');

const render = require('../util/render');
const { nextApi } = require("../lib/endpoints");
const { customHeader } = require("../lib/request")

const { AccountValidtor } = require("../lib/validate");
const sitemap = require("../lib/sitemap");
const { isAPIError, buildApiError, errMessage } = require("../lib/response");

const router = new Router();

// Ask user to enter email
router.get('/', async (ctx) => {
  /**
   * @type {{done: "letter_sent" | "password_reset"}}
   */
  const alert = ctx.session.alert;

  /**
   * When password reset letter is sent, or password is reset.
   */
  if (alert) {
    ctx.state.alert = alert;
    ctx.body = await render('forgot-password/success.html', ctx.state);

    delete ctx.session.alert;
    return;
  }

  // Handle errors passed from redirection.
  if (ctx.session.errors) {
    ctx.state.errors = ctx.session.errors;
  }
  
  ctx.body = await render('forgot-password/enter-email.html', ctx.state);

  // Delete errors from session.
  delete ctx.session.errors;
});

// Collect user entered email, check if email is valid, and send letter.
// After letter is sent, redirect back to the GET page with a message.
router.post('/', async function (ctx, next) {
  /**
   * @type {{email: string}}
   */
  const account = ctx.request.body;
  /**
   * @param {(null | {email: string})} result
   * @param {(null | {email: string})} errors
   */
  const { result, errors } = new AccountValidtor(account)
    .validateEmail()
    .end();

  debug("Validation result: %O, error: %O", result, errors);

  if (errors) {
    ctx.state.errors = errors;
    ctx.state.email = email;

    return await next();
  }

  try {    
    // Ask API to sent email.
    await request.post(nextApi.sendPasswordResetLetter)
      .set(customHeader(ctx.ip, ctx.header["user-agent"]))
      .send(result);

    // Tell redirected page what message to show.
    ctx.session.alert = {
      "done": "letter_sent"
    };

    // Redirect to /password-reset
    return ctx.redirect(ctx.path);

  } catch (e) {
    ctx.state.email = account.email;

    if (!isAPIError(e)) {
      ctx.state.errors = {
        server: e.message,
      };

      return await next();
    }

    /**
     * @type {APIError}
     */
    const body = e.response.body;
    switch (e.status) {
      // If the email used to receive password reset token is not found
      case 404:
        ctx.state.errors = {
          email: errMessage.email_not_found,
        };
        break;

      // 400 for JOSN parsing failure; 422 if `email` is missing.
      // { server: "any server error" }
      // or
      // { email: email_missing_field }
      default:
        ctx.state.errors = buildApiError(body);
        break;
    }

    return await next();
  }
}, async (ctx) => {
  ctx.body = await render('forgot-password/enter-email.html', ctx.state);
});

// Verify password reset token and show reset password page.
// API response has only two results: 200 or 404
router.get('/:token', async (ctx) => {
  // Get `token` from URL parameter.
  const token = ctx.params.token;

  try {
    // Query API if this token exists and is valid.
    const resp = await request.get(`${nextApi.verifyPasswordResetToken}/${token}`);

    /**
     * Token exists and is valid, the email associated with this token is returned from API.
     * Show the email on UI so that know for which account he is resetting password.
     * @type {{email: string}}
     */
    const body = resp.body;
    ctx.state.email = body.email;

    // Show form to allow user to enter new password.
    return ctx.body = await render('forgot-password/new-password.html', ctx.state);

  } catch (e) {
    // If any error occurred, redirect back to /user/password-reset.
    if (!isAPIError(e)) {
      ctx.session.errors = {
        server: e.message,
      };

      return ctx.redirect(sitemap.passwordReset);
    }

    const body = e.response.body;

    // 400
    // 404 if the token is not found, expired, or the the user associated with the token is not found.
    switch (e.status) {
      case 404:
        ctx.state.errors = {
          token: errMessage.password_token_invalid,
        };
        break;
      
      // 400 if request URL does not contain a token
      // { server: "Invalid request URI" }
      default:
        ctx.state.errors = buildApiError(body)
        break;
    }
    
    return ctx.redirect(sitemap.passwordReset);
  }
});

// User submit new password.
// When user submit new password, token should also be included.
// There are edege cases that the momenet user clicked submit button,
// the token is expired.
router.post('/:token', async (ctx, next) => {
  const token = ctx.params.token;

  /**
   * @type {{password: string, confirmPassword: string}}
   */
  const account = ctx.request.body;
  const { result, errors } = new AccountValidtor(account)
    .validatePassword()
    .confirmPassword()
    .end();

  if (errors) {
    ctx.state.errors = errors

    return await next();
  }

  try {

    await request.post(nextApi.resetPassword)
      .send({
        token,
        password: result.password
      });
    
    ctx.session.alert = {
      done: "password_reset"
    };

    // Redirect to /password-reset to prevent user refresh.
    return ctx.redirect(sitemap.passwordReset);

  } catch (e) {
    if (!isAPIError(e)) {
      ctx.state.errors = {
        server: e.message
      };

      return await next();
    }
    /**
     * @type {APIError}
     */
    const body = e.response.body;
    // 400, 422
    // 404 here means the token is invalid or expired. Handle it separatedly.
    switch (e.status) {
      // 404 Not Found indicates the password reset token is not found or is invalid.
      // Redirect user to /user/password_reset
      case 404:
        ctx.state.errors = {
          token: errMessage.password_token_invalid,
        };
        ctx.redirect(sitemap.passwordReset);
        break;

      // 400: { server: "Problems parsing JSON" }
      // 422: { password: password_missing_field} 
      // || {password: password_invalid} 
      // || {token: token_missing_field}
      default:
        ctx.state.errors = buildApiError(body);
    }

    return await next();
  }
}, async function(ctx) {
  ctx.body = await render('forgot-password/new-password.html', ctx.state);
});

module.exports = router.routes();