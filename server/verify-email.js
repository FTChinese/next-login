const Router = require('koa-router');
const request = require('superagent');
const endpoints = require('../util/endpoints');
const {processApiError, buildAlertDone} = require('../util/errors');
const render = require('../util/render');

const router = new Router();

// Confirm verfication token
router.get('/:token', async (ctx) => {
  const token = ctx.params.token;

  try {
    const resp = await request.put(`${endpoints.verifyEmail}/${token}`)
      .set('X-User-Id', ctx.session.user.id);

   ctx.body = await render('email-verified');

  } catch (e) {
    ctx.session.errors = processApiError(e, 'email_token');

    ctx.body = await render('email-verified');
  }
});

module.exports = router.routes();