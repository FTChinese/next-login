const Router = require('koa-router');
const request = require('superagent');
const endpoints = require('../util/endpoints');
const {processApiError, buildAlertDone} = require('../util/errors');
const debug = require('../util/debug')('user:verification');
const render = require('../util/render');

const router = new Router();

// Confirm verfication token
router.get('/email/:token', async (ctx) => {
  const token = ctx.params.token;

  try {
    const resp = await request
      .put(`${endpoints.verifyEmail}/${token}`);

    // Update verification status if session exists
    if (ctx.session.user) {
      debug.info('Update session data after email verified');
      ctx.session.user.vrf = true;
    }

    ctx.state.alert = buildAlertDone('email_verified');

    ctx.body = await render('email-verified.html', ctx.state);

  } catch (e) {
    ctx.state.errors = processApiError(e, 'email_token');
    ctx.body = await render('email-verified');
  }
});

// You may add other routers to verify tools like mobile phone, etc..

module.exports = router.routes();