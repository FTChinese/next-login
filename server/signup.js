const path = require('path');
const pkg = require('../package.json');
const request = require('superagent');
const Router = require('koa-router');

const schema = require('./schema');

const render = require('../util/render');
const {processJoiError, processApiError} = require('../util/errors');
const debug = require('../util/debug')('user:signup');
const endpoints = require('../util/endpoints');
const {accountToSess} = require('./helper.js')

const router = new Router();

// Show signup page
router.get('/', async (ctx) => {
  debug.info('ctx.state: %O', ctx.state);
  ctx.body = await render('signup.html', ctx.state);
});

// User submitted account to be created.
router.post('/', async (ctx, next) => {
  const result = schema.account.validate(ctx.request.body.account, { abortEarly: false });

  if (result.error) {
    ctx.state.errors = processJoiError(result.error);
    ctx.state.account = {
      email: result.value.email
    }

    return await next();
  }
  /**
   * @type {{email: string, password: string, ip: string}} user
   */
  const account = result.value;
  account.ip = ctx.ip;

  // Request to API
  try {
    const resp = await request.post(endpoints.createAccount)
      .set('X-Client-Type', 'web')
      .set('X-Client-Version', pkg.version)
      .set('X-User-Ip', ctx.ip)
      .set('X-User-Agent', ctx.header['user-agent'])
      .send(account);

    ctx.session = {
      user: accountToSess(resp.body),
    };

    ctx.cookies.set('logged_in', 'yes');

    const redirectTo = ctx.state.sitemap.email;

    // Redirect to user's email page
    return ctx.redirect(redirectTo);

  } catch (e) {
    // 400， 422， 429
    ctx.state.errors = processApiError(e, "signup");
    ctx.state.account = {
      email: account.email
    };

    return await next();
  }
}, async(ctx) => {
  ctx.body = await render('signup.html', ctx.state);
});

module.exports = router.routes();