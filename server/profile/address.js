const Router = require('koa-router');
const debug = require("debug")('user:address');
const render = require('../../util/render');
const {
  AddressValidator
} = require("../../lib/validate");
const {
  sitemap
} = require("../../model/sitemap");
const {
  isAPIError,
  buildErrMsg,
  buildApiError
} = require("../../lib/response");
const {
  FtcUser,
} = require("../../model/account");

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

    return ctx.redirect(sitemap.profile);

  } catch (e) {
    ctx.state.address = address;

    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.state.errors = buildErrMsg(e);

      return await next();
    }

    /**
     * @type {{message: string, error: Object}}
     */
    const body = e.response.body;

    ctx.state.errors = buildApiError(body);

    ctx.body = await render('profile/address.html', ctx.state);
  }
});

module.exports = router.routes();
