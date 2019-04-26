const Router = require('koa-router');
const debug = require("debug")('user:address');
const render = require('../../util/render');
const {
  sitemap
} = require("../../lib/sitemap");
const {
  ClientError,
} = require("../../lib/response");
const FtcUser = require("../../lib/ftc-user");
const {
  validateAddress,
} = require("../schema");

const router = new Router();

/**
 * @description Show address page
 * /user/profile/address
 */
router.get('/', async (ctx) => {

  /**
   * @type {IAddress}
   */
  const address = await new FtcUser(ctx.session.user.id)
    .fetchAddress();

  ctx.state.address = address;

  ctx.body = await render('profile/address.html', ctx.state);
});

/**
 * @description Update address
 * /user/profile/address
 */
router.post('/', async (ctx, next) => {

  /**
   * @type {IAddress}
   */
  const address = ctx.request.body.address;

  const { value, errors } = validateAddress(address);

  if (errors) {
    ctx.state.errors = errors;
    ctx.state.address = value;

    return await next();
  }

  try {
    await new FtcUser(ctx.session.user.id)
      .updateAddress(value)

    ctx.session.alert = {
      key: "saved"
    };

    return ctx.redirect(sitemap.profile);

  } catch (e) {
    ctx.state.address = address;

    const clientErr = new ClientError(e);
    if (!clientErr.isFromAPI()) {
      throw e;
    }

    ctx.state.errors = clientErr.buildFormError();

    ctx.body = await render('profile/address.html', ctx.state);
  }
});

module.exports = router.routes();
