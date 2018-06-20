const request = require('superagent');
const Router = require('koa-router');
const Joi = require('joi');

const schema = require('../schema');

const render = require('../../utils/render');
const {handleJoiErr, handleAPIUnprocessable} = require('../../utils/errors');
const debug = require('../../utils/debug')('user:login');
const endpoints = require('../../utils/endpoints');

const router = new Router();

const config = {
  path: '/signup',
};

// Show signup page
router.get('/', async (ctx) => {
/**
   * @type {{source: string, email: string}} query
   */
  const query = ctx.query;
  const ip = ctx.request.ip;
  debug.info("IP: %s", ip);

  // Prepopulate email if user is redirected from signup page.
  ctx.state.user = {
    email: query.email
  };

  debug.info(ctx.state);

  ctx.body = await render('new-user/signup.html', ctx.state);
});

// User submitted account to be created.
router.post('/', async (ctx, next) => {
  /**
   * @type {{email: string, password: string, ip: string}} user
   */
  let user = ctx.request.body.user;

  // Validate 
  try {
    user = await Joi.validate(user, schema.credentials, {abortEarly: false});

  } catch (e) {
    const errors = handleJoiErr(e);
    ctx.state.errors = errors;
    ctx.state.user = {
      email: user.email
    };
    
    return await next();
  }

  const ip = ctx.request.ip;
  user.ip = ip;

  // Request to API
  try {
    const resp = await request.post(endpoints.createAccount)
      .send(user);

    // After user account is created, set session data so that user status it changed from anonymous to loggedin.
    /**
     * @type {User}
     */
    const u = resp.body;

    ctx.session.user = {
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      isVip: u.isVip,
      verified: u.verified,
    }

    return ctx.redirect(`${ctx.path}/plan`);
  } catch (e) {
    const errors = handleAPIUnprocessable(e);

    ctx.status = e.status || 400;
    ctx.state.errors = errors;

    ctx.state.user = {
      email: user.email
    }

    return await next();
  }
}, async(ctx) => {
  ctx.body = await render('new-user/signup.html', ctx.state);
});

module.exports = router.routes();