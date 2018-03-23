const debug = require('debug')('user:login');
const Router = require('koa-router');
const Joi = require('joi');
const schema = require('./schema');

const render = require('../utils/render');
const {ErrorForbidden} = require('../utils/http-errors');
const request = require('superagent');
const router = new Router();

router.get('/', async (ctx) => {
  /**
   * @todo If logged in users visit this page, redirect them away:
   * 1. If query parameter has `from=<url>` and this from url is a legal `ftchinese.com` hostname, redirect them to the from url; otherwise redirect them to home page
   * 2. If there is no query parameter named `from`, we should lead user to its account page.
   */
  ctx.body = await render('login.html', ctx.state);
});

router.post('/', async (ctx, next) => {
  /**
   * @type {{email: string, password: string}} credentials
   */
  const credentials = ctx.request.body.credentials;

  try {
    debug("Validate: %O", credentials);

    /**
     * @type {{email: string, password: string}} validated
     */
    const validated = await Joi.validate(credentials, schema.credentials);
    debug("Validate result: %O", validated);

    const resp = await request.post('http://localhost:8000/authenticate')
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send(credentials);

    /**
     * @type {{sub: string, name: string}} idToken
     */
    const idToken = resp.body;
    debug('Authentication result: %o', idToken);

    // Keep login state
    ctx.session.user = {
      sub: idToken.sub,
      name: idToken.name,
      email: credentials.email.trim()
    };

    return ctx.redirect('/profile');

  } catch (e) {
    // Make the form stikcy.
    ctx.state.credentials = {
      email: credentials.email.trim()
    };

    // Handle validation error
    const joiErrs = schema.gatherErrors(e);
    if (joiErrs) {
      debug('Joi validation errors: %O', joiErrs);
      ctx.state.errors = {
        credentials: "用户名或密码无效"
      };
      return await next();
    }

    // API error e.status == 400, e.status == 422 should not be exposed to user.

    // Handle API error
    if (404 == e.status) {
      // Email not registered yet. Lead user to signup page.
      debug('Email not found');
      ctx.state.errors = {
        notFound: credentials.email.trim()
      };
      return await next();
    }

    if (401 == e.status) {
      // Unauthorized means password incorrect
      debug('Password incorrect');
      ctx.state.errors = {
        credentials: "用户名或密码无效"
      };
      return await next();
    }

    throw e
  }
}, async (ctx, next) => {
  return ctx.body = await render('login.html', ctx.state);
});

module.exports = router.routes();
