const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:password-reset');

const render = require('../util/render');
const {
  nextApi
} = require("../model/endpoints");

const {
  AccountValidtor
} = require("../lib/validate");
const {
  sitemap
} = require("../model/sitemap");
const {
  isAPIError,
  buildApiError,
  buildErrMsg,
  errMessage
} = require("../lib/response");

const {
  clientApp,
} = require("./middleware");
const {
  sendPasswordResetLetter,
  ForgotPassword
} = require("../model/request");

const router = new Router();

/**
 * @description Ask user to enter email
 * /user/password-reset
 */
router.get('/', async (ctx) => {

  /**
   * When password reset letter is sent, or password is reset.
   * @type {{key: "letter_sent | password_reset"}}
   */
  if (ctx.session.alert) {
    ctx.state.alert = ctx.session.alert;
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

/**
 * @description Collect user entered email, check if email is valid, and send letter.
 * After letter is sent, redirect back to the GET page with a message.
 * /user/password-reset
 */
router.post('/', 

  clientApp(),

  async function (ctx, next) {
    /**
     * @type {{email: string}}
     */
    const email = ctx.request.body.email;

    debug("Password reset email: %s", email);

    /**
     * @param {(null | {email: string})} result
     * @param {(null | {email: string})} errors
     */
    const {
      result,
      errors
    } = new AccountValidtor({ email })
      .validateEmail()
      .end();

    debug("Validation result: %O, error: %O", result, errors);

    if (errors) {
      ctx.state.errors = errors;
      ctx.state.email = email;

      return await next();
    }

    try {

      await ForgotPassword.sendResetLetter(
        result.email,
        ctx.state.clientApp,
      )

      // Tell redirected page what message to show.
      ctx.session.alert = {
        "key": "letter_sent"
      };

      // Redirect to /password-reset
      return ctx.redirect(ctx.path);

    } catch (e) {
      ctx.state.email = email;

      if (!isAPIError(e)) {
        ctx.state.errors = buildErrMsg(e);

        return await next();
      }

      /**
       * @type {APIError}
       */
      const body = e.response.body;
      debug("%O", body);

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
  }, 
  
  async (ctx) => {
    ctx.body = await render('forgot-password/enter-email.html', ctx.state);
  }
);

/**
 * @description Verify password reset token and show reset password page.
 * API response has only two results: 200 or 404
 * /user/password-reset/:token
 */
router.get('/:token', async (ctx) => {
  // Get `token` from URL parameter.
  const token = ctx.params.token;

  try {

    ctx.state.email = await ForgotPassword.verifyToken(token);

    // Show form to allow user to enter new password.
    return ctx.body = await render('forgot-password/new-password.html', ctx.state);

  } catch (e) {
    // If any error occurred, redirect back to /user/password-reset.
    if (!isAPIError(e)) {
      ctx.session.errors = buildErrMsg(e);

      return ctx.redirect(sitemap.passwordReset);
    }

    const body = e.response.body;

    // 400
    // 404 if the token is not found, expired, or the the user associated with the token is not found.
    switch (e.status) {
      case 404:
        ctx.session.errors = {
          token: errMessage.password_token_invalid,
        };
        break;

        // 400 if request URL does not contain a token
        // { server: "Invalid request URI" }
      default:
        ctx.session.errors = buildApiError(body)
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
  const {
    result,
    errors
  } = new AccountValidtor(account)
    .validatePassword()
    .confirmPassword()
    .end();

  if (errors) {
    ctx.state.errors = errors

    return await next();
  }

  try {

    await ForgotPassword.reset(token, result.password);

    ctx.session.alert = {
      key: "password_reset"
    };

    // Redirect to /password-reset to prevent user refresh.
    return ctx.redirect(sitemap.passwordReset);

  } catch (e) {
    if (!isAPIError(e)) {
      ctx.state.errors = buildErrMsg(e);

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
        ctx.session.errors = {
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
}, async function (ctx) {
  ctx.body = await render('forgot-password/new-password.html', ctx.state);
});

module.exports = router.routes();
