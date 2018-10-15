const Router = require('koa-router');
const request = require('superagent');
const schema = require('./schema');

const debug = require('../util/debug')('user:address');
const render = require('../util/render');
const endpoints = require('../util/endpoints');
const {processJoiError, processApiError, buildAlertDone} = require('../util/errors');

const router = new Router();

// Show address
router.get('/', async (ctx) => {
  const userId = ctx.session.user.id;

  const resp = await request.get(endpoints.profile)
    .set('X-User-Id', userId);

  /**
   * @type {Profile}
   */
  const profile = resp.body;
  const address = profile.address;
  debug.info('User address: %O', address);

  ctx.state.address = address;

  ctx.body = await render('address.html', ctx.state);
});

// Update address
router.post('/', async (ctx, next) => {

  const result = schema.address.validate(ctx.request.body.address, {abortEarly: false});
  if (result.error) {
    ctx.session.errors = processJoiError(result.error);
    
    return ctx.redirect(ctx.path);
  }

  /**
   * @type {Address}
   */
  const address = result.value;

  try {

    const userId = ctx.session.user.id;

    await request.patch(endpoints.address)
      .set('X-User-Id', userId)
      .send(address);

    ctx.session.alert = buildAlertDone('address_saved')

    return ctx.redirect(ctx.path);

  } catch (e) {
    ctx.session.errors = processApiError(e)

    return ctx.redirect(ctx.path);
  }
});

module.exports = router.routes();