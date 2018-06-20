const request = require('superagent');
const Router = require('koa-router');
const schema = require('../schema');
const debug = require('../../utils/debug')('user:handle-reset');
const render = require('../../utils/render');
const endpoints = require('../../utils/endpoints');
const {handleJoiErr, handleApiUnprocessable, isSuperAgentErr} = require('../../utils/errors');

const router = new Router();

// User clicked link from email
router.get('/:token', async function (ctx) {
  const token = ctx.params.token;

  try {
    const resp = await request.get(`${endpoints.verifyResetToken}/${token}`);

    /**
     * @type {User}
     */
    const user = resp.body;
    ctx.state.email = user.email;

    return ctx.body = await render('password/new-password.html', ctx.state);

  } catch (e) {
    if (!isSuperAgentErr(e)) {
      throw e;
    }
    if (404 === e.status) {
      ctx.session.invalidLink = true;

      // Redirect to /password-reset
      const redirectTo = dirname(ctx.path);

      return ctx.redirect(redirectTo);
    }

    // Display other API errors for now.
    ctx.body = e.response.body;
  }
});

router.post('/:code', async (ctx, next) => {
  const token = ctx.params.token;

  /**
   * @type {{error: Object, value: Object}}
   */
  const result = schema.reset.validate(ctx.request.body);

  if (result.error) {
    ctx.state.errors = handleJoiErr(result.error);
    return await next();
  }
  
  /**
   * @type {{password: string, confirmPassword: string}}
   */
  const pws = result.value

  // Check if the password equals confirmed one
  if (pws.password !== pws.confirmPassword) {
    ctx.state.errors = {
      mismatch: {
        message: "两次输入的密码不符，请重新输入"
      }
    };

    return await next();
  }

  try {

    await request.post(endpoints.passwordReset)
      .send({
        token,
        password: pw.password
      });
    
    ctx.session.success = {
      pwReset: true
    };

    // Redirect to /password-reset to prevent user refresh.
    return ctx.redirect(dirname(ctx.path));

  } catch (e) {
    if (!isSuperAgentErr(e)) {
      throw e;
    }

    if (404 === e.status) {
      ctx.session.invalidLink = true;

      // Redirect to /password-reset
      const redirectTo = dirname(ctx.path);

      debug.info('Token %s not found. Redirect to %s', token, redirectTo);

      return ctx.redirect(redirectTo);
    }

    if (422 === e.status) {
      ctx.state.errors = handleApiUnprocessable(e)

      return await next();
    }

    // Display other API error for now.
    return ctx.body = e.response.body;
  }
}, async function(ctx) {
  ctx.body = await render('password/new-password.html', ctx.state);
});

module.exports = router.routes();