const Router = require('koa-router');
const debug = require("debug")('user:password-reset');

const render = require('../util/render');

const {
  sitemap
} = require("../lib/sitemap");
const {
  errMessage,
  ClientError,
} = require("../lib/response");

const {
  ForgotPassword
} = require("../lib/request");

const {
  clientApp,
} = require("./middleware");

const {
  validateEmail,
  validatePasswordReset,
} = require("./schema");

const router = new Router();

/**
 * @description Ask user to enter email
 * /user/password-reset
 */
router.get('/', async (ctx) => {

  /**
   * When password reset letter is sent, or password is reset.
   * @type {{key: "letter_sent" | "password_reset"}}
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
 * @description Send a password reset letter.
 * /user/password-reset
 */
router.post('/', 

  clientApp(),

  async function (ctx, next) {
    /**
     * @type {string}
     */
    const email = ctx.request.body.email;

    const { value, errors } = validateEmail(email);

    debug("Validation error: %O", errors);

    if (errors) {
      ctx.state.errors = errors;
      ctx.state.email = value.email;

      return await next();
    }

    try {

      await ForgotPassword.sendResetLetter(
        value.email,
        ctx.state.clientApp,
      );

      // Tell redirected page what message to show.
      ctx.session.alert = {
        "key": "letter_sent"
      };

      // Redirect to /password-reset
      return ctx.redirect(ctx.path);

    } catch (e) {
      ctx.state.email = email;

      const clientErr = new ClientError(e);
      if (!clientErr.isFromAPI()) {
        ctx.state.errors = clientErr.buildGenericError();
        return await next();
      }

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
          ctx.state.errors = clientErr.buildFormError();
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
 * /password-reset/:token
 */
router.get('/:token', async (ctx) => {
  // Get `token` from URL parameter.
  const token = ctx.params.token;

  try {

    const email = await ForgotPassword.verifyToken(token);
    ctx.state.email = email;
    ctx.session.email = email;

    // Show form to allow user to enter new password.
    return ctx.body = await render('forgot-password/new-password.html', ctx.state);

  } catch (e) {
    // If any error occurred, redirect back to /user/password-reset.
    const clientErr = new ClientError(e);

    if (!clientErr.isFromAPI()) {
      ctx.session.errors = clientErr.buildGenericError();

      return ctx.redirect(sitemap.passwordReset);
    }

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
        ctx.session.errors = clientErr.buildApiError()
        break;
    }

    return ctx.redirect(sitemap.passwordReset);
  }
});

/**
 * @description User reset password.
 * /password-reset/:token
 */
router.post('/:token', 

  async (ctx, next) => {
    const token = ctx.params.token;

    /**
     * @type {{password: string, confirmPassword: string}}
     */
    const passwords = ctx.request.body;

    const { value, errors } = validatePasswordReset(passwords);

    if (errors) {
      ctx.state.errors = errors

      ctx.state.email = ctx.session.email;
      return await next();
    }

    if (value.password != value.confirmPassword) {
      ctx.state.errors = {
        confirmPassword: errMessage.passwords_mismatched,
      }

      ctx.state.email = ctx.session.email;
      return await next();
    }

    try {

      await ForgotPassword.reset(token, value.password);

      ctx.session.alert = {
        key: "password_reset"
      };

      // Redirect to /password-reset to prevent user refresh.
      ctx.redirect(sitemap.passwordReset);
      delete ctx.session.email;

      return;
    } catch (e) {

      const clientErr = new ClientError(e);

      if (!clientErr.isFromAPI(e)) {
        ctx.state.errors = clientErr.buildGenericError();

        ctx.state.email = ctx.session.email;
        return await next();
      }
      /**
       * @type {APIError}
       */
      // const body = e.response.body;
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
          ctx.state.errors = clientErr.buildFormError();
      }

      ctx.state.email = ctx.session.email;
      return await next();
    }
  }, 
  async function (ctx) {
    ctx.body = await render('forgot-password/new-password.html', ctx.state);
  }
);

module.exports = router.routes();
