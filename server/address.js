const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:address');
const render = require('../util/render');
const { nextApi } = require("../lib/endpoints");
const { AddressValidator } = require("../lib/validate");
const sitemap = require("../lib/sitemap");
const { isAPIError, buildApiError } = require("../lib/response");

const router = new Router();

// Show address
router.get('/', async (ctx) => {
  const userId = ctx.session.user.id;

  const resp = await request.get(nextApi.profile)
    .set('X-User-Id', userId);

  /**
   * @type {Profile}
   */
  const profile = resp.body;

  ctx.state.address = profile.address;

  ctx.body = await render('address.html', ctx.state);
});

// Update address
router.post('/', async (ctx, next) => {

  /**
   * @type {{province: string, city: string, district: string, postcode: string}}
   */
  const address = ctx.request.body.address;
  
  const { result, errors } = new AddressValidator(address).validate();

  if (errors) {
    ctx.state.errors = errors;
    ctx.state.address = address;

    return await next();
  }

  try {

    const userId = ctx.session.user.id;

    await request.patch(nextApi.address)
      .set('X-User-Id', userId)
      .send(result);

    ctx.session.alert = {
      key: "saved"
    };

    return ctx.redirect(sitemap.address);

  } catch (e) {
    ctx.state.address = address;

    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.state.errors = {
        message: e.message
      };

      return await next();
    }

    /**
     * @type {{message: string, error: Object}}
     */
    const body = e.response.body;

    ctx.state.errors = buildApiError(body);

    return await next();
  }
}, async(ctx, next) => {
  const userId = ctx.session.user.id;

  const resp = await request.get(nextApi.profile)
    .set('X-User-Id', userId);

  /**
   * @type {Profile}
   */
  const profile = resp.body;

  ctx.state.address = Object.assign(profile.address, ctx.state.address);

  ctx.body = await render('address.html', ctx.state);
});

module.exports = router.routes();