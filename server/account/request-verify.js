const Router = require('koa-router');
const debug = require('debug')('user:email');

const {
  sitemap
} = require("../../model/sitemap");
const {
  isAPIError,
  buildApiError
} = require("../../lib/response");
const {
  FtcUser,
} = require("../../model/request");
const {
  clientApp,
} = require("../middleware");

const router = new Router();

/**
 * @description Resend verfication letter
 * /user/account/request-verification
 */
router.post("/", 

  clientApp(), 

  async (ctx) => {

    try {

      await new FtcUser(ctx.session.user.id)
        .requestVerificationLetter(ctx.state.clientApp);

      ctx.session.alert = {
        key: "letter_sent"
      };

      return ctx.redirect(sitemap.account);
    } catch (e) {

      /**
       * @todo build error message.
       */
      return ctx.redirect(sitemap.account);
    }
  }
);

module.exports = router.routes();
