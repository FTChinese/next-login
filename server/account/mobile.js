const request = require('superagent');
const Router = require('koa-router');
const path = require('path');
const schema = require('../schema');

const debug = require('../../utils/debug')('user:profile');
const endpoints = require('../../utils/endpoints');
const {processJoiError, processApiError, buildAlertDone} = require('../../utils/errors');

const router = new Router();

router.post('/', async (ctx) => {

  const redirectTo = path.resolve(ctx.path, '../');

  const result = schema.mobile.validate(ctx.request.body.account);

  if (result.error) {
    ctx.session.errors = processJoiError(result.error)

    return ctx.redirect(redirectTo);
  }

  /**
   * @type {{mobile: string}}
   */
  const account = result.value;

  try {

    await request.patch(endpoints.mobile)
      .set('X-User-Id', ctx.session.user.id)
      .send(account);

    ctx.session.alert = buildAlertDone('mobile_saved');

    return ctx.redirect(redirectTo);
    
  } catch (e) {

    ctx.session.errors = processApiError(e);

    return ctx.redirect(redirectTo);
  }
});

module.exports = router.routes();