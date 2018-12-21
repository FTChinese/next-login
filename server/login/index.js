const pkg = require('../../package.json');
const request = require('superagent');
const path = require('path');
const Router = require('koa-router');


const debug = require('debug')('user:login');
const render = require('../../util/render');
const endpoints = require('../../util/endpoints');
const { LoginValidator } = require("../../lib/validate")
const simtemap = require("../../lib/validate");
const {processJoiError, processApiError, isAPIError: isAPIError } = require('../../util/errors');
const {accountToSess} = require('../helper.js');

// const wechat = require('./wechat');

const router = new Router();

// Show login page
router.get('/', async function (ctx) {
  // If user is trying to access this page when he is already logged in, redirect away
  if (ctx.session.user) {
    const redirectTo = ctx.state.sitemap.profile;
    
    debug('A logged in user is trying to login again. Redirect to: %s', redirectTo);
  
    return ctx.redirect(redirectTo);
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

  if (errors) {
    ctx.state.errors = errors;
    ctx.state.credentials = credentials;

    return await next();
  }

  // Send data to API
  try {
    const resp = await request.post(endpoints.login)
      .set('X-Client-Type', 'web')
      .set('X-Client-Version', pkg.version)
      .set('X-User-Ip', ctx.ip)
      .set('X-User-Agent', ctx.header['user-agent'])
      .send(result);

    /**
     * @type {Account}
     */
    const account = resp.body;
    debug.info('Authentication result: %o', account);

    // Keep login state
    ctx.session = {
      user: accountToSess(account),
    };

    ctx.cookies.set('logged_in', 'yes');

    return ctx.redirect(sitemap.profile);

  } catch (e) {
    if (!isAPIError(e)) {
      throw e;
    }

    const body = err.response.body;

    // 400, 422, 404, 403
    switch (e.status) {
      case 400:
        break;
      case 404:
      case 403:
        break;
      case 422:
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