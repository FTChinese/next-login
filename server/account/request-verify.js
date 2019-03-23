const request = require('superagent');
const Router = require('koa-router');
const debug = require('debug')('user:email');

const {
  sitemap
} = require("../../model/sitemap");
const {
  nextApi
} = require("../../model/endpoints");
const {
  isAPIError,
  buildApiError
} = require("../../lib/response");
const {
  customHeader
} = require("../../lib/request");

const router = new Router();

/**
 * @description Resend verfication letter
 * /user/account/request-verification
 */
router.post("/", async (ctx) => {

  try {
    const userId = ctx.session.user.id;

    await request.post(nextApi.requestVerification)
      .set(customHeader(ctx.ip, ctx.header["user-agent"]))
      .set('X-User-Id', userId);

    ctx.session.alert = {
      done: "letter_sent"
    };

    return ctx.redirect(sitemap.account);
  } catch (e) {


    return ctx.redirect(sitemap.account);
  }
});

module.exports = router.routes();
