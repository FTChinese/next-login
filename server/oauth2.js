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
const {
  sitemap,
} = require("../lib/sitemap");
const {
  unixNow,
} = require("../lib/time");
const {
  checkSession,
  isLoggedIn,
} = require("./middleware");

const router = new Router();

/**
 * @description This is used to handle FTA's OAuth request. Deny any request that does not come from this domain.
 * GET /authorize?response_type=code&client_id=xxxx&redirect_uri=xxx&state=xxx
 */
router.get("/authorize", 

  checkSession({redirect: false}),

  async (ctx, next) => {

    /**
     * @type {{response_type: "code", client_id: string, redirect_uri: string, state: string}}
     */
    const query = ctx.request.query;
    // If user is not logged in, redirect user to login page and save the oauth paramters.
    if (!isLoggedIn(ctx)) {
      if (query.client_id && query.redirect_uri) {
        ctx.session.oauth = {
          ...query,
          t: unixNow(),
        };
      }
  
      debug("FTA OAuth parameters: %O", ctx.session.oauth);
      return ctx.redirect(sitemap.login);
    }

    const oauth = new OAuthServer(ctx.request.query);

    // Validate OAuth query paramters
    const result = oauth.validateRequest();

    // If validation passed, show authorize page.
    if (!result) {
      return await next();
    }

    // Accoding to OAuth protocol, you should redirect /// user back to client if:
    // response_type is missing: error=invalid_request
    // response_type != code: error=unsupported_response_type
    // state is missing: error=invalid_request
    if (result.shouldRedirect) {
      ctx.redirect(oauth.buildErrRedirect(result));
      return;
    }

    ctx.state.invalid = result;

    await next();
  }, 
  async (ctx) => {
    ctx.body = await render("authorize.html", ctx.state);
  }
);

/**
 * @description User grant/deny OAuth request.
 * /authorize
 */
router.post("/authorize", checkSession(), async (ctx, next) => {
    /**
     * @type {IOAuthReq}
     */
    const query = ctx.request.query;
    if (!query) {
      debug("Authorize page is accessed without OAuth query parameters.");
      ctx.state = 404;
      return;
    }

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
      ctx.redirect(sitemap.profile);
      delete ctx.session.oauth;

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

      delete ctx.session.oauth;

    } catch (e) {

      delete ctx.session.oauth;
      
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
