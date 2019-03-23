const request = require('superagent');
const Router = require('koa-router');
const debug = require('debug')('user:login');

const render = require('../../util/render');
const {
  AccountValidtor
} = require("../../lib/validate");

const {
  errMessage,
  isAPIError,
  buildApiError,
  buildErrMsg
} = require("../../lib/response");

const {
  setClientHeader,
  KEY_USER_ID,
} = require("../../lib/request");

const {
  nextApi
} = require("../../model/endpoints");

const {
  sitemap
} = require("../../model/sitemap");

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

  /**
   * @type {{email: string, password: string} || null} 
   */
  const {
    result,
    errors
  } = new AccountValidtor(credentials)
    .validateEmail(true)
    .validatePassword(true)
    .end();

  debug("Validation result: %O, error: %O", result, errors);

  if (errors) {
    ctx.state.errors = errors;
    ctx.state.credentials = credentials;

    return await next();
  }

  // Send data to API
  try {
    const authResp = await request.post(nextApi.login)
      .set(setClientHeader(ctx.ip, ctx.header["user-agent"]))
      .send(result);

    /**
     * @type {{id: string}}
     */
    const user = authResp.body;
    debug('Login result: %o', user);

    const resp = await request.get(nextApi.account)
      .set(KEY_USER_ID, user.id)
    
      /**
       * @type {Account}
       */
    const account = resp.body;

    // Keep login state
    ctx.session = {
      user: account,
    };

    ctx.cookies.set('logged_in', 'yes');

    return ctx.redirect(sitemap.profile);

  } catch (e) {
    // stick form
    ctx.state.credentials = credentials

    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.state.errors = buildErrMsg(e);

      return await next();
    }

    /**
     * @type {{message: string, error: Object}}
     */
    const body = e.response.body;
    debug("API error response: %O", body);

    // 404, 403
    switch (e.status) {
      case 404:
      case 403:
        ctx.state.errors = {
          credentials: errMessage.credentials_invalid,
        };
        break;

      // 400: { server: "Problems parsing JSON" }
      // 422: 
      // email: email_missing_field || email_invalid
      // password: password_missing_field || password_invalid
      default:
        ctx.state.errors = buildApiError(body);
        break;
    }

    debug("Errors: %O", ctx.state.errors);

    return await next();
  }
}, async (ctx) => {
  ctx.body = await render('login.html', ctx.state);
});

module.exports = router.routes();
