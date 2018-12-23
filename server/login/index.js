const request = require('superagent');
const Router = require('koa-router');
const debug = require('debug')('user:login');

const render = require('../../util/render');
const { nextApi } = require("../../lib/endpoints");
const { LoginValidator } = require("../../lib/validate")
const sitemap = require("../../lib/sitemap");
const { isAPIError, buildApiError } = require("../../lib/response");
const { customHeader } = require("../../lib/request");
const { toJWT } = require("../../lib/session");

// const wechat = require('./wechat');

const router = new Router();

// Show login page
router.get('/', async function (ctx) {
  // If user is trying to access this page when he is already logged in, redirect away
  if (ctx.session.user) {
    return ctx.redirect(sitemap.profile);
  }

  ctx.body = await render('login.html', ctx.state);
});

router.post('/', async function (ctx, next) {
  /**
   * @todo Keep session longer
   */
  let remeberMe = ctx.request.body.remeberMe;

  /**
   * @type {{email: string, password: string}}
   */
  const credentials = ctx.request.body.credentials;

  const {result, errors} = new LoginValidator(credentials)
    .validate(credentials);

  debug("Validation result: %O, error: %O", result, errors);

  if (errors) {
    ctx.state.errors = errors;
    ctx.state.credentials = credentials;

    return await next();
  }

  // Send data to API
  try {
    const resp = await request.post(nextApi.login)
      .set(customHeader(ctx.ip, ctx.header["user-agent"]))
      .send(result);

    /**
     * @type {Account}
     */
    const account = resp.body;
    debug('Authentication result: %o', account);

    // Keep login state
    ctx.session = {
      user: toJWT(account),
    };

    ctx.cookies.set('logged_in', 'yes');

    return ctx.redirect(sitemap.profile);

  } catch (e) {
    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.state.errors = {
        server: e.message
      };
      // stick form
      ctx.state.credentials = credentials;

      return await next();
    }

    /**
     * @type {{message: string, error: Object}}
     */
    const body = e.response.body;

    // 404, 403
    switch (e.status) {
      case 404:
      case 403:
        ctx.state.errors = {
          credentials: "邮箱或密码错误"
        };
        break;
      
      // 400, 422, 
      default:
        ctx.state.errors = buildApiError(body);
        break;
    }

    // stick form
    ctx.state.credentials = credentials

    return await next();
  }
}, async (ctx) => {
  ctx.body = await render('login.html', ctx.state);
});

// Lauch Authorization Request
// router.get('/wechat', wechat.authRequest);
// Get Access Token Response
// router.post('/wechat/access', wechat.accessResponse);

module.exports = router.routes();