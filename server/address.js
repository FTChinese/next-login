const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:address');
const render = require('../util/render');
const {
  nextApi
} = require("../model/endpoints");
const {
  AddressValidator
} = require("../lib/validate");
const {
  sitemap
} = require("../model/sitemap");
const {
  isAPIError,
  buildApiError
} = require("../lib/response");
const {
  FtcUser,
} = require("../model/account");

const router = new Router();

// Show address
router.get('/', async (ctx) => {

  /**
   * @type {IAddress}
   */
  const address = await new FtcUser(ctx.session.user.id)
    .fetchAddress();

  ctx.state.address = address;

  if (ctx.session.alert) {
    ctx.state.alert = ctx.session.alert;
  }

  ctx.body = await render('address.html', ctx.state);

  delete ctx.session.alert;
});

// Update address
router.post('/', async (ctx, next) => {

  /**
   * @type {IAddress}
   */
  const address = ctx.request.body.address;

  const {
    result,
    errors
  } = new AddressValidator(address).validate();

  if (errors) {
    ctx.state.errors = errors;
    ctx.state.address = address;

    return await next();
  }

  try {
    await new FtcUser(ctx.session.user.id)
      .updateAddress(result)

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

    ctx.body = await render('address.html', ctx.state);
  }
});

module.exports = router.routes();
