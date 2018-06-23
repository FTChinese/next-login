const Router = require('koa-router');
const request = require('superagent');

const schema = require('../schema');

const debug = require('../../utils/debug')('user:password');
const endpoints = require('../../utils/endpoints');
const {processJoiError, processApiError} = require('../../utils/errors');

const router = new Router();

router.post('/', async (ctx, next) => {

  // Validate
  const result = schema.changePassword.validate(ctx.request.body);
  if (result.error) {
    const errors = processJoiError(result.error);
    ctx.session.errors = errors;

    return ctx.redirect(ctx.path);
  }

  /**
   * @type {{oldPassword: string, newPassword: string, confirmPassword: string}}
   */
  const pass = result.value;
  // Ensure new password confirmed
  if (pass.newPassword !== pass.confirmPassword) {
    ctx.state.errors = {
      confirmPassword: {
        message: '两次输入的新密码必须相同'
      }
    };

    return await next();
  }

  try {
    await request.patch(endpoints.password)
      .send({
        oldPassword: pass.oldPassword,
        newPassword: pass.newPassword
      });

    ctx.session.alert = {
      saved: true
    };

    return ctx.redirect(ctx.path);

  } catch (e) {

    ctx.state.errors = processApiError(e, 'oldPassword');

    return ctx.redirect(ctx.path);
  }
});

module.exports = router.routes();