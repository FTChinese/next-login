const Router = require('koa-router');
const debug = require('debug')('user:redeem');
const render = require('../../util/render');

const Account = require("../../lib/account");
const {
  ClientError,
  errMessage,
} = require("../../lib/response");

const {
  validateGiftCode,
} = require("../schema");

const router = new Router();

/**
 * @description Show redeem page
 */
router.get("/", async(ctx, next) => {

  ctx.body = await render("subscription/redeem.html", ctx.state);
});

/**
 * @description Redeem gift card.
 */
router.post("/", async (ctx, next) => {
  const code = ctx.request.body.code;

  const { value, errors } = validateGiftCode(code);

  if (errors) {
    ctx.state.errors = errors;
    ctx.state.code = code;

    return await next();
  }

  debug("Validation result: %O", value);

  /**
   * @type {Account}
   */
  const account = ctx.state.user;

  try {
    await account.redeemGiftCard(value.code);

    ctx.body = await render("subscription/redeem-ok.html", ctx.state);
  } catch (e) {
    ctx.state.code = code;

    const clientErr = new ClientError(e);

    if (!clientErr.isFromAPI()) {
      throw e;
    }

    switch (e.status) {
      case 404:
        ctx.state.errors = {
          redeem_code: errMessage.redeem_code_not_found,
        };
        break;

      // code: code_missing_field
      // member: member_already_exists
      default:
        ctx.state.errors = clientErr.buildFormError();
        break;
    }

    return await next()
  }

}, async(ctx) => {
  ctx.body = await render("subscription/redeem.html", ctx.state);
});

module.exports = router.routes();
