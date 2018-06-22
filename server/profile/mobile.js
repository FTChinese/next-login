const request = require('superagent');
const Router = require('koa-router');
const {dirname} = require('path');
const schema = require('../schema');

const debug = require('../../utils/debug')('user:profile');
const endpoints = require('../../utils/endpoints');
const {processJoiError, processApiError} = require('../../utils/errors');

const router = new Router();

router.post('/', async (ctx) => {

  const redirectTo = `${dirname(ctx.path)}/account`;

  const result = schema.mobile.validate(ctx.request.body.account);

  if (result.error) {
    const errors = processJoiError(result.error)
    ctx.session.errors = errors;

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

    ctx.session.alert = {
      mobile: true
    };

    return ctx.redirect(redirectTo);
    
  } catch (e) {

    const errors = processApiError(e)

    ctx.session.errors = errors;

    return ctx.redirect(redirectTo);
  }
});

module.exports = router.routes();