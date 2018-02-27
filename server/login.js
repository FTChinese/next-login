const debug = require('debug')('login:server');
const Router = require('koa-router');
const render = require('../utils/render');
const {ErrorForbidden} = require('../utils/http-errors');
const request = require('superagent');
const router = new Router();

async function showPage (ctx) {
  /**
   * @todo If logged in users visit this page, redirect them away:
   * 1. If query parameter has `from=<url>` and this from url is a legal `ftchinese.com` hostname, redirect them to the from url; otherwise redirect them to home page
   * 2. If there is no query parameter named `from`, we should lead user to its account page.
   */
  debug("Access data: %o", ctx.accessData);
  ctx.body = await render('login.html', ctx.state);
};

router.get('/', showPage);

router.post('/', async (ctx, next) => {
  /**
   * @todo Validate user input and handle invalid input accordingly.
   */

  /**
   * @type {Object} credentials
   * @property {string} email
   * @property {string} password
   */
  const credentials = ctx.request.body.credentials;


  /**
   * @todo handle invalid access token
   */
  const resp = await request.post('http://localhost:8000/authenticate')
    .auth(ctx.accessData.access_token, {type: 'bearer'})
    .send(credentials);

  /**
   * @type {Object}
   * @property {string} sub - uuid
   * @property {string} name - displable user name
   */
  const authResult = resp.body;

  /**
   * @todo handle authentication failure: email or password is invalid
   */

  debug('Authentication result: %o', authResult);

  // After successful authentication, save user information to cookie.
  ctx.session.user = {
    sub: authResult.sub,
    name: authResult.name,
    email: credentials.email
  };

  return ctx.redirect('/settings');
});




module.exports = router.routes();
