const Router = require('koa-router');
const request = require('superagent');
const {dirname} = require('path');
const schema = require('../schema');

const debug = require('../../utils/debug')('user:email');
const endpoints = require('../../utils/endpoints');
const {processJoiError, processApiError, isSuperAgentError} = require('../../utils/errors');

const router = new Router();

router.post('/', async (ctx) => {

  const redirectTo = `${dirname(ctx.path)}/account`;

  const result = schema.email.validate(ctx.request.body.account);
  if (result.error) {
    const errors = processJoiError(result.error);

    ctx.session.errors = errors;

    return ctx.redirect(redirectTo);
  }

  /**
   * @type {{email: string}}
   */
  const account = result.value;

  try {
    const resp = await request.patch(endpoints.email)
      .set('X-User-Id', ctx.session.user.id)
      .send(account);

    // If resp.status === 204, the email is not altered
    if (200 === resp.status) {
      debug.info('Email changed')
      ctx.session.alert = {
        email: true
      };
    }
    
    return ctx.redirect(redirectTo);
  } catch (e) {

    const errors = processApiError(e);
    ctx.session.errors = errors;

    return ctx.redirect(redirectTo);
  }
});

router.post('/request-verification', async (ctx) => {
  const redirectTo = `${dirname(dirname(ctx.path))}/account`;

  try {
    await request.post(endpoints.requestVerification)
      .set('X-User-Id', ctx.session.user.id);

    ctx.session.alert = {
      resent: true
    };

    return ctx.redirect(redirectTo);
  } catch (e) {
    debug.error(e);
    throw e;
  }
});

router.get('/confirm-verification/:token', async (ctx) => {
  const token = ctx.params.token;

  try {
    const resp = await request.put(`${endpoints.verifyEmail}/${token}`)
      .set('X-User-Id', ctx.session.user.id);

    /**
     * @type {User}
     */
    const user = resp.body;
    debug.info("User info after verification: %O", user);

    ctx.session.user.verified = user.verified;

    ctx.redirect('/profile/account');

  } catch (e) {
    if (!isSuperAgentError(e)) {
      throw e;
    }

    if (404 === e.status) {
      debug.info('Verify email respond not found');
      
      ctx.session.alert = {
        invalidLink: true
      }
    }

    ctx.redirect('/profile/account');
  }
});

module.exports = router.routes();