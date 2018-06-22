const Router = require('koa-router');
const request = require('superagent');
const {dirname} = require('path');
const schema = require('../schema');

const debug = require('../../utils/debug')('user:name');
const endpoints = require('../../utils/endpoints');
const {processJoiError, processApiError} = require('../../utils/errors');

const router = new Router();

router.post('/', async (ctx) => {

  const redirectTo = `${dirname(ctx.path)}/account`;

  debug.info('Redirect to %s', redirectTo);

  const result = schema.username.validate(ctx.request.body.account)

  if (result.error) {
    const errors = processJoiError(result.error)
    ctx.session.errors = errors;

    return ctx.redirect(redirectTo);
  }

  /**
   * @type {{name: string}}
   */
  const account = result.value;

  try {

    await request.patch(endpoints.name)
      .set('X-User-Id', ctx.session.user.id)
      .send(account);

    ctx.session.alert = {
      name: true
    };

    ctx.session.user.name = account.name;
    
    return ctx.redirect(redirectTo);

  } catch (e) {

    const errors = processApiError(e)

    ctx.session.errors = errors;

    return ctx.redirect(redirectTo);
  }
});

module.exports = router.routes();