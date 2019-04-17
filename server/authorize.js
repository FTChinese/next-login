const Router = require('koa-router');
const debug = require("debug")("user:authorize");
const render = require("../util/render");
const OAuthServer = require("../lib/oauth-server");
const {
  ClientError,
} = require("../lib/response");
const {
  oauthApprove,
} = require("./schema");

const router = new Router();

/**
 * @description This is used to handle FTA's OAuth request. Deny any request that does not come from this domain.
 * /authorize?response_type=code&client_id=xxxx&redirect_uri=xxx&state=xxx
 */
router.get('/', async (ctx, next) => {
  const oauth = new OAuthServer(ctx.request.query);

  const result = oauth.validateRequest();

  if (!result) {
    ctx.body = await render("authorize.html", ctx.state);

    return;
  }

  if (result.shouldRedirect) {
    ctx.redirect(oauth.buildErrRedirect(result));
    return;
  }

  ctx.state.invalid = result;

  ctx.body = await render("authorize.html", ctx.state);
});

/**
 * @description User grant/deny OAuth request.
 * /authorize
 */
router.post("/", async (ctx, next) => {
    /**
     * @type {IOAuthReq}
     */
    const query = ctx.request.query;

    // Validte query parameters
    const oauth = new OAuthServer(query);
    const result = oauth.validateRequest();

    if (result) {
      if (result.shouldRedirect) {
        ctx.redirect(oauth.buildErrRedirect(result));
        return;
      }
    
      ctx.state.invalid = result;
    
      ctx.body = await render("authorize.html", ctx.state);

      return;
    }

    const body = ctx.request.body;
    const { value, error } = oauthApprove(body);
    if (error) {
      throw error;
    }

    if (!value.approve) {
      ctx.redirect(oauth.buildErrRedirect({
        error: "access_denied",
      }));

      return;
    }

    try {
      /**
       * @description Ask API to generate a code.
       * @type {code: string}
       */
      const granted = await oauth.createCode(ctx.session.user);

      debug("Granted code: %O", granted);

      const redirectTo = oauth.buildRedirect(granted.code);

      ctx.redirect(redirectTo);
    } catch (e) {
      const clientErr = new ClientError(e);
      if (!clientErr.isFromAPI()) {
        throw e;
      }

      /**
       * @type {APIError}
       */
      const body = e.response.body;

      switch (e.status) {
        // body.error.field: "error"
        // body.error.code: "unauthorized_client" || "invalid_request"
        case 422:
          ctx.redirect(oauth.buildErrRedirect({
            error: body.error.code,
          }));
          return;

        default:
          ctx.state.invalid = {
            error_description: body.message
          }
          break;
      }

      ctx.body = await render("authorize.html", ctx.state);
    }
});

module.exports = router.routes();
