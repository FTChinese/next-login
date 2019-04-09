const Router = require('koa-router');
const debug = require("debug")("user:authorize");
const {
  OAuthClient,
} = require("../lib/oauth-client")

const router = new Router();

/**
 * @description Handle OAuth redirect request.
 * /authorize?response_type=code&client_id=xxxx&redirect_uri=xxx&state=xxx
 */
router.get('/', async (ctx, next) => {
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
});

module.exports = router.routes();
