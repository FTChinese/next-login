const debug = require('debug')('user:login');
const Joi = require('joi');
const request = require('superagent');
const schema = require('../schema');
const render = require('../../utils/render');
const endpoints = require('../../utils/endpoints');
const {handleJoiErr, handleApiUnprocessable} = require('../../utils/errors');

const Router = require('koa-router');
// const wechat = require('./wechat');

const router = new Router();

router.get('/', async function (ctx) {
  /**
   * @todo If logged in users visit this page, redirect them away:
   * 1. If query parameter has `from=<url>` and this from url is a legal `ftchinese.com` hostname, redirect them to the from url; otherwise redirect them to home page
   * 2. If there is no query parameter named `from`, we should lead user to its account page.
   */
  ctx.body = await render('login.html', ctx.state);
});

router.post('/', async function (ctx, next) {
  let returnTo = ctx.query.return_to;
  /**
   * @type {{email: string, password: string}} credentials
   */
  let credentials = ctx.request.body.credentials;
  /**
   * @todo Keep session longer
   */
  let remeberMe = ctx.request.body.remeberMe;

  // Validate input
  try {
    credentials = await Joi.validate(credentials, schema.credentials);
  } catch (e) {
    const errors = handleJoiErr(e);

    ctx.state.errors = errors;

    return await next();
  }

  credentials.ip = ctx.ip;

  try {
    const resp = await request.post(endpoints.login)
      .send(credentials);

    /**
     * @type {User}
     */
    const user = resp.body;
    debug.info('Authentication result: %o', user);

    // Keep login state
    ctx.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      isVip: user.isVip,
      verified: user.verified
    };

    if (returnTo) {
      return ctx.redirect(returnTo);
    }
    return ctx.redirect('/profile');

  } catch (e) {
    if (!e.response) {
      throw e;
    }
    // Make the form stikcy.
    ctx.state.credentials = {
      email: credentials.email.trim()
    };

    // Handle API validation error
    if (422 === e.status) {
      const errors = handleApiUnprocessable(e);
      ctx.errors = errors;
      return await next();
    }
    
    // email + password combination is not found because either the email does not exist, or password is wrong.
    // Currently the API does not tell which one is wrong to prevent brutal force hacking.
    if (404 === e.status) {
      ctx.errors = {
        notFound: "邮箱或密码错误"
      };
      return await next();
    }

    /**
     * @todo Properly handle any other unknown errors.
     */
    throw e;
  }
}, async (ctx, enxt) => {
  ctx.body = await render('login.html', ctx.state);
});

// Lauch Authorization Request
// router.get('/wechat', wechat.authRequest);
// Get Access Token Response
// router.post('/wechat/access', wechat.accessResponse);

module.exports = router.routes();