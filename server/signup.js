const Router = require('koa-router');
const debug = require("debug")('user:signup');

const render = require('../util/render');
const {
  AccountValidtor
} = require("../lib/validate");
const {
  sitemap
} = require("../lib/sitemap");
const {
  errMessage,
  ClientError,
} = require("../lib/response");
const {
  clientApp,
} = require("./middleware");
const Credentials = require("../lib/credentials");

const router = new Router();

// Show signup page
router.get('/', async (ctx) => {

  if (ctx.session.user) {
    return ctx.redirect(sitemap.profile);
  }

  ctx.body = await render('signup.html', ctx.state);
});

// User submitted account to be created.
router.post('/', 
  clientApp(),

  async (ctx, next) => {
    /**
     * @type {{email: string, password: string}}
     */
    const account = ctx.request.body.account;
    const {
      result,
      errors
    } = new AccountValidtor(account)
      .validateEmail()
      .validatePassword()
      .end();

    debug("Validation result: %O, error: %O", result, errors);

    if (errors) {
      ctx.state.errors = errors;
      ctx.state.account = account;

      return await next();
    }

    // Request to API
    try {
      const account = await new Credentials(result)
        .signUp(ctx.state.clientApp);

      ctx.session = {
        user: account,
      };

      ctx.cookies.set('logged_in', 'yes');

      // Redirect to user's email page
      return ctx.redirect(sitemap.profile);

    } catch (e) {
      ctx.state.account = account;

      const clientErr = new ClientError(e);

      if (!clientErr.isFromAPI()) {
        ctx.state.errors = clientErr.buildGenericError();

        return await next();
      }

      // 400， 422， 429
      switch (e.status) {
        case 429:
          ctx.state.errors = {
            message: errMessage.too_many_requests,
          };
          break;

          // 422: {email: email_missing_field}
          // {email: email_invalid}
          // {email: email_already_exists}
          // {password: password_missing_field}
          // {password: password_invalid}
          // 400: {server: "Problems parsing JSON"}
        default:
          ctx.state.errors = clientErr.buildAPIError();
          break;
      }

      return await next();
    }
  }, 
  async (ctx) => {
    ctx.body = await render('signup.html', ctx.state);
  }
);

module.exports = router.routes();
