const {
  URL,
  URLSearchParams,
} = require("url");
const Router = require('koa-router');
const debug = require("debug")("user:authorize");
const {
  OAuthClient,
} = require("../lib/oauth-client");
const {
  isLoggedIn
} = require("./middleware");
const {
  sitemap,
} = require("../lib/sitemap");
const {
  isProduction,
} = require("../lib/config");
const Account = require("../lib/account");

const ftaHostname = "www.ftacademy.cn";

const router = new Router();

/**
 * @description Handle OAuth redirect request.
 * /authorize?response_type=code&client_id=xxxx&redirect_uri=xxx&state=xxx
 */
router.get('/', 
  async (ctx, next) => {

    if (isProduction) {
      const srcUrl = new URL(ctx.header["referer"]);
      if (srcUrl.hostname !== ftaHostname) {
        ctx.state = 404;
        return;
      }
    }

    // If user is already logged in, request authorization code directly.
    if (isLoggedIn(ctx)) {
      /**
       * @type {IAccount}
       */
      const acntData = ctx.session.user;
      ctx.state.user = new Account(acntData);
      return await next();
    }

    const query = ctx.request.query;
    const params = new URLSearchParams(query);
    const redirectTo = `${sitemap.login}?${params.toString()}`;

    ctx.redirect(redirectTo);
    return;
  },

  async (ctx, next) => {
    /**
     * @type {IOAuthReq}
     */
    const query = ctx.request.query;

    // Validte query parameters

    const client = new OAuthClient(query);

    /**
     * @type {code: string}
     */
    const granted = await client.requestCode(ctx.session.user);

    debug("Granted code: %O", granted);

    const redirectTo = client.buildRedirect(granted.code);

    ctx.redirect(redirectTo);
  }
);

module.exports = router.routes();
