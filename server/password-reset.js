const _ = require('lodash');
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
  if (alert) {
    ctx.state.alert = alert;
    ctx.body = await render('password/success.html', ctx.state);

    delete ctx.session.alert;
    return;
  }

  // Handle invalid token for password reset.
  if (ctx.session.errors) {
    ctx.state.errors = errMessage[ctx.sessions.errors.key];
  }
  
  ctx.body = await render('password/enter-email.html', ctx.state);

  delete ctx.state.errors;
});

// Collect user entered email, check if email is valid, and send letter.
router.post('/', async function (ctx, next) {
  /**
   * @type {{email: string}}
   */
  const account = ctx.request.body;
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
    if (!isAPIError(e)) {
      ctx.state.errors = {
        server: e.message,
      };

      ctx.state.email = email;

      return await next();
    }

    /**
     * @type {APIError}
     */
    const body = e.response.body;
    // 400, 422, 404
    switch (e.status) {
      case 404:
        ctx.state.errors = {
          email: errMessage.email_not_found,
        };
        break;

      default:
        ctx.state.errors = buildApiError(body);
        break;
    }

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
    const resp = await request.get(`${nextApi.verifyPasswordResetToken}/${token}`);

    /**
     * User is found and show page to enter new password
     * @type {{email: string}}
     */
    const body = resp.body;
    ctx.state.email = body.email;

    return ctx.body = await render('password/new-password.html', ctx.state);

  } catch (e) {
    if (!isAPIError(e)) {
      ctx.state.errors = {
        server: e.message,
      };

      return await next();
    }

    const body = e.response.body;

    // 400
    // 404 if the token is not found, or the the user associated with the token is not found.
    switch (e.status) {
      case 404:
        ctx.state.errors = {
          token: errMessage.password_token_invalid,
        };
        break;

      default:
        ctx.state.errors = buildApiError(body)
        break;
    }
    
    return await next();
  }
}, async (ctx) => {
  ctx.body = await render("password/enter-email.html", ctx.state);
});

// User submit new password
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

  if (error) {
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
      case 404:
        ctx.session.errors = {
          key: "password_token_invalid"
        };
        ctx.redirect(sitemap.passwordReset);
        break;

      default:
        ctx.state.errors = buildApiError(body);
    }

    return await next();
  }
}, async function(ctx) {
  ctx.body = await render('password/new-password.html', ctx.state);
});

module.exports = router.routes();