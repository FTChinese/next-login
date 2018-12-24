const pkg = require('../package.json');
const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:signup');

const render = require('../util/render');
const { SignupValidator } = require("../lib/validate");

const sitemap = require("../lib/sitemap");
const { isAPIError, buildApiError } = require("../lib/response");
const { customHeader } = require("../lib/request");
const { toJWT } = require("../lib/session");

const router = new Router();

// Show signup page
router.get('/', async (ctx) => {

  if (ctx.session.user) {
    return ctx.redirect(sitemap.profile);
  }

  ctx.body = await render('signup.html', ctx.state);
});

// User submitted account to be created.
router.post('/', async (ctx, next) => {
  /**
   * @type {{email: string, password: string}}
   */
  const account = ctx.request.body.account;
  const { result, errors } = new SignupValidator(account)
    .validate();

  debug("Validation result: %O, error: %O", result, errors);

  if (errors) {
    ctx.state.errors = errors;
    ctx.state.account = account;

    return await next();
  }

  // Request to API
  try {
    const resp = await request.post(endpoints.signup)
      .set('X-Client-Type', 'web')
      .set('X-Client-Version', pkg.version)
      .set('X-User-Ip', ctx.ip)
      .set('X-User-Agent', ctx.header['user-agent'])
      .send(result);

    ctx.session = {
      user: toJWT(resp.body),
    };

    ctx.cookies.set('logged_in', 'yes');

    // Redirect to user's email page
    return ctx.redirect(sitemap.profile);

  } catch (e) {
    if (!isAPIError(e)) {
      ctx.state.errors = {
        server: e.message
      };
      ctx.state.account = account;

      return await next();
    }

    /**
     * @type {APIError}
     */
    const body = e.response.body;
    // 400， 422， 429
    switch (e.status) {
      case 429:
        ctx.state.errors = {
          server: "您创建账号过于频繁，请稍后再试"
        };
        break;

      default:
        ctx.state.errors = buildApiError(body);
        break;
    }

    ctx.state.account = account;

    return await next();
  }
}, async(ctx) => {
  ctx.body = await render('signup.html', ctx.state);
});

module.exports = router.routes();