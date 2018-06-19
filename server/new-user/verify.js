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
      .send({email});
    
    /**
     * @type {{name: string, email: string, isVIP: boolean, verified: boolean}}
     */
    const account = resp.body;
    debug.info("Account info after verification: %O", account);

    ctx.session.user.verified = account.verified;

    ctx.redirect('/profile/email');
  } catch (e) {
    debug.info(e.response.body);

    ctx.session.errors = {
      verify: true
    };
    ctx.redirect('/profile/email');
  }
});

module.exports = router.routes();