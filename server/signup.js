const request = require('superagent');
const Router = require('koa-router');

const schema = require('./schema');

const render = require('../utils/render');
const {processJoiError, processApiError} = require('../utils/errors');
const debug = require('../utils/debug')('user:signup');
const endpoints = require('../utils/endpoints');

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

  /**
   * @todo Limit request per IP
   */

  // Request to API
  try {
    const resp = await request.post(endpoints.createAccount)
      .send(account);

    /**
     * @type {User}
     */
    const user = resp.body;

    ctx.session ={
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        isVip: user.isVip,
        verified: user.verified,
      }
    };
    ctx.cookies.set('logged_in', 'yes');

    // Redirect to user's email page
    return ctx.redirect(path.resolve(ctx.path, '/email'));

  } catch (e) {
    ctx.state.errors = processApiError(e);
    ctx.state.account = {
      email: account.email
    };

    return await next();
  }
}, async(ctx) => {
  ctx.body = await render('signup.html', ctx.state);
});

module.exports = router.routes();