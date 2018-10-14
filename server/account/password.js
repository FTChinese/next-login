const Router = require('koa-router');
const request = require('superagent');
const path = require('path');

const schema = require('../schema');

const debug = require('../../util/debug')('user:password');
const endpoints = require('../../util/endpoints');
const {processJoiError, processApiError, buildAlertDone, buildInvalidField} = require('../../util/errors');

const router = new Router();

// Submit new password
router.post('/', async (ctx, next) => {
  const redirectTo = path.resolve(ctx.path, '../');
  // Validate
  const result = schema.changePassword.validate(ctx.request.body);
  if (result.error) {
    ctx.session.errors = processJoiError(result.error);

    return ctx.redirect(redirectTo);
  }

  /**
   * @type {{oldPassword: string, password: string, confirmPassword: string}}
   */
  const pass = result.value;
  // Ensure new password confirmed
  if (pass.password !== pass.confirmPassword) {
    ctx.state.errors = buildInvalidField('confirmPassword', 'mismatched');

    return await next();
  }

  try {
    await request.patch(endpoints.password)
      .set('X-User-Id', ctx.session.user.id)
      .send({
        oldPassword: pass.oldPassword,
        newPassword: pass.password
      });

    ctx.session.alert = buildAlertDone('password_saved');

    return ctx.redirect(redirectTo);

  } catch (e) {

    ctx.session.errors = processApiError(e, 'oldPassword');

    debug.info('Session data: %O', ctx.session);;

    return ctx.redirect(redirectTo);
  }
});

module.exports = router.routes();