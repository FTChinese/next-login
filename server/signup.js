const Router = require('koa-router');
const debug = require("debug")('user:signup');

const render = require('../util/render');
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
const {
  validateSignUp,
} = require("./schema");

const router = new Router();

/**
 * @description Show signup page
 */
router.get('/', async (ctx) => {

  if (ctx.session.user) {
    return ctx.redirect(sitemap.profile);
  }

  ctx.body = await render('signup.html', ctx.state);
});

/**
 * @description Create account
 * /signup
 */
router.post('/', 
  clientApp(),

  async (ctx, next) => {
    /**
     * @type {ICredentials}
     */
    const input = ctx.request.body.credentials;

    const { value, errors } = validateSignUp(input);

    debug("Validation error: %O", errors);

    if (errors) {
      ctx.state.errors = errors;
      ctx.state.credentials = value;

      return await next();
    }

    // Request to API
    try {
      const account = await new Credentials(value)
        .signUp(ctx.state.clientApp);

        ctx.session.user = account;

      // ctx.cookies.set('logged_in', 'yes');

      // Handle FTA OAUth request.
      if (ctx.session.oauth) {
        const params = new URLSearchParams(ctx.session.oauth)
        const redirectTo = `${sitemap.authorize}?${params.toString()}`
        ctx.redirect(redirectTo);

        delete ctx.session.oauth;
      } else {
        return ctx.redirect(sitemap.profile);
      }
    } catch (e) {
      ctx.state.credentials = input;

      const clientErr = new ClientError(e);

      if (!clientErr.isFromAPI()) {
        throw e;
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
          ctx.state.errors = clientErr.buildFormError();
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
