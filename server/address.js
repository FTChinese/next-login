const Router = require('koa-router');
const request = require('superagent');
const schema = require('./schema');

const debug = require('../utils/debug')('user:address');
const render = require('../utils/render');
const endpoints = require('../utils/endpoints');
const {processJoiError, processApiError, buildAlertDone} = require('../utils/errors');

const router = new Router();

// Show address
router.get('/', async (ctx) => {
  const resp = await request.get(endpoints.profile)
    .set('X-User-Id', ctx.session.user.id);

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

  // Testing only currently.
  return ctx.body = address;

  try {

    await request.patch(endpoints.address)
      .set('X-User-Id', ctx.session.user.id)
      .send(address);

    ctx.session.alert = buildAlertDone('address_saved')

    return ctx.redirect(ctx.path);

  } catch (e) {
    ctx.session.errors = processApiError(e)

    return ctx.redirect(ctx.path);
  }
});

module.exports = router.routes();