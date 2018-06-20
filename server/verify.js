const request = require('superagent');
const Router = require('koa-router');
const debug = require('../../utils/debug')('user:verify');
const render = require('../../utils/render');
const endpoints = require('../../utils/endpoints');

const router = new Router();

router.get('/:token', async function(ctx) {
  const token = ctx.params.token;
  const email = ctx.session.user.email;

  debug.info('Email: %s, verification token: %s', email, token);
  
  try {
    const resp = await request.put(`${endpoints.verifyEmail}/${token}`)
      .set('X-User-Id', ctx.session.user.id);
    
    /**
     * @type {User}
     */
    const user = resp.body;
    debug.info("User info after verification: %O", user);

    ctx.session.user.verified = user.verified;

    ctx.redirect('/profile/email');
  } catch (e) {
    if (!e.response) {
      throw e;
    }

    if (404 !== e.status) {
      throw e;
    }
    
    ctx.session.errors = {
      verifyFailed: true
    };
    
    ctx.redirect('/profile/email');
  }
});

module.exports = router.routes();