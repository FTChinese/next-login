const debug = require('debug')('user:login');
const Router = require('koa-router');
const Joi = require('joi');
const render = require('../utils/render');
const {ErrorForbidden} = require('../utils/http-errors');
const request = require('superagent');
const router = new Router();

const schema = Joi.object().keys({
  email: Joi.string().email().min(3).max(30).required(),
  password: Joi.string().regex(/^[a-zA-Z0-9]{8,20}$/).required()
});

router.get('/', async (ctx) => {
  /**
   * @todo If logged in users visit this page, redirect them away:
   * 1. If query parameter has `from=<url>` and this from url is a legal `ftchinese.com` hostname, redirect them to the from url; otherwise redirect them to home page
   * 2. If there is no query parameter named `from`, we should lead user to its account page.
   */
  ctx.state.errors = ctx.session.errors;

  debug("Template data: %o", ctx.state);
  ctx.body = await render('login.html', ctx.state);

  delete ctx.session.errors;
});

router.post('/', async (ctx, next) => {
  /**
   * @type {Object} credentials
   * @property {string} email
   * @property {string} password
   */
  const credentials = ctx.request.body.credentials;

  try {
    debug("Validate: %O", credentials);

    const result = await Joi.validate(credentials, schema);

    console.log("Validate result: %O", result);

  } catch (e) {
    debug("Validation error: %O", e)

    ctx.session.errors = {
      invalidCredentials: true
    }
    return ctx.redirect('/login');
  }

  try {
    const resp = await request.post('http://localhost:8000/authenticate')
    .auth(ctx.accessData.access_token, {type: 'bearer'})
    .send(credentials);

  /**
   * @type {Object}
   * @property {string} sub - uuid
   * @property {string} name - displayable user name
   */
    const authResult = resp.body;
    debug('Authentication result: %o', authResult);

    // After successful authentication, save user information to cookie.
    ctx.session.user = {
      sub: authResult.sub,
      name: authResult.name,
      email: credentials.email
    };
  } catch (e) {
    // Errors thrown by requesting to API
    debug("Error: %O", e);

    ctx.session.errors = {
      loginFailed: true
    };

    return ctx.redirect('/login');
  }

  // Everything OK.
  return ctx.redirect('/settings/profile');
});

module.exports = router.routes();
