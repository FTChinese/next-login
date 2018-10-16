/// <reference path="account.js">

const pkg = require('../../package.json');
const request = require('superagent');
const path = require('path');
const Router = require('koa-router');
const schema = require('../schema');

const debug = require('../../util/debug')('user:login');
const render = require('../../util/render');
const endpoints = require('../../util/endpoints');
const {processJoiError, processApiError} = require('../../util/errors');
const {accountToSess} = require('../helper.js');

// const wechat = require('./wechat');

const router = new Router();

// Show login page
router.get('/', async function (ctx) {
  // If user is trying to access this page when he is already logged in, redirect away
  if (ctx.session.user) {
    const redirectTo = ctx.state.sitemap.profile;
    
    debug.info('A logged in user is trying to login again. Redirect to: %s', redirectTo);
  
    return ctx.redirect(redirectTo);
  }

  ctx.body = await render('login.html', ctx.state);
});

router.post('/', async function (ctx, next) {
  /**
   * @todo Keep session longer
   */
  let remeberMe = ctx.request.body.remeberMe;

  // Validate input
  const result = schema.login.validate(ctx.request.body.credentials, { abortEarly: false });

  if (result.error) {
    ctx.state.errors = processJoiError(result.error);
    ctx.state.credentials = {
      email: result.value.email
    };

    return await next();
  }

  /**
   * @type {{email: string, password: string}}
   */
  const credentials = result.value;

  // Send data to API
  try {
    const resp = await request.post(endpoints.login)
      .set('X-Client-Type', 'web')
      .set('X-Client-Version', pkg.version)
      .set('X-User-Ip', ctx.ip)
      .set('X-User-Agent', ctx.header['user-agent'])
      .send(credentials);

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

    const redirectTo = path.resolve(ctx.path, '../profile');
    
    debug.info('Login success. Redirect to: %s', redirectTo);

    return ctx.redirect(redirectTo);

  } catch (e) {
    // 400, 422, 404
    ctx.state.errors = processApiError(e, 'credentials');

    // stick form
    ctx.state.credentials = {
      email: credentials.email
    };

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