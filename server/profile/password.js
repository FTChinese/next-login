const debug = require('debug')('user:password');
const Router = require('koa-router');
const request = require('superagent');
const Joi = require('joi');
const schema = require('../schema');
const {isAlradyExists} = require('../../utils/check-error');
const render = require('../../utils/render');

const router = new Router();

router.get('/', async (ctx, next) => {
  ctx.body = await render('profile/password.html', ctx.state);
});

router.post('/', async (ctx, next) => {
  /**
   * @type {{currentPassword: string, password: string, passwordConfirmation: string}}
   */
  let user = ctx.request.body;

  try {
    user = await Joi.validate(user, schema.changePassword);

    // User is using current password as new password
    if (user.currentPassword == user.password) {
      debug('Use is using current password');
      ctx.state.errors = {
        notChanged: '新密码应该不同于当前密码'
      }
      return await next();
    }

    // Confirmed password does not match the new one
    if (user.password == user.passwordConfirmation) {
      debug('Confirmation password mismatch');
      ctx.state.errors = {
        confirmMismatch: '两次输入的新密码不同'
      };

      return await next();
    }

    /**
     * @todo Authenticate user with current password
     * Update user password
     */

  } catch (e) {
    debug(e);
  }
}, async (ctx, next) => {
  ctx.body = await render('profile/password.html', ctx.state);
});

module.exports = router.routes();