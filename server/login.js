const Router = require('koa-router');
const {
  URLSearchParams,
} = require("url");
const debug = require('debug')('user:login');

const render = require('../util/render');
const {
  AccountValidtor
} = require("../lib/validate");

const {
  errMessage,
  ClientError,
} = require("../lib/response");
const {
  sitemap
} = require("../lib/sitemap");
const Credentials = require("../lib/credentials");
const {
  generateState,
} = require("../lib/random");
const {
  WxUser,
  wxOAuth,
} = require("../lib/wxlogin");
const {
  isProduction,
} = require("../lib/config");

const {
  clientApp,
} = require("./middleware");

const router = new Router();

// Show login page
router.get('/', async function (ctx) {
  // If user is trying to access this page when he is already logged in, redirect away
  if (ctx.session.user) {
    return ctx.redirect(sitemap.profile);
  }

  ctx.body = await render('login.html', ctx.state);
});

router.post('/',

  clientApp(), 
  
  async function (ctx, next) {
    /**
     * @todo Keep session longer
     */
    let remeberMe = ctx.request.body.remeberMe;

    /**
     * @type {ICredentials}
     */
    const credentials = ctx.request.body.credentials;

    /**
     * @type {{email: string, password: string}} 
     */
    const {
      result,
      errors
    } = new AccountValidtor(credentials)
      .validateEmail(true)
      .validatePassword(true)
      .end();

    if (errors) {
      ctx.state.errors = errors;
      ctx.state.credentials = credentials;

      return await next();
    }

    // Send data to API
    try {
      /**
       * @type {Account}
       */
      const account = await new Credentials(result)
        .login(ctx.state.clientApp);

      // Keep login state
      ctx.session = {
        user: account,
      };

      ctx.cookies.set('logged_in', 'yes');

      const query = ctx.request.query;

      if (query.response_type && query.client_id) {
        const params = new URLSearchParams(query)
        const redirectTo = `${sitemap.authorize}?${params.toString()}`
        return ctx.redirect(redirectTo);
      } else {
        return ctx.redirect(sitemap.profile);
      }

    } catch (e) {
      // stick form
      ctx.state.credentials = credentials;

      const clientErr = new ClientError(e);

      if (!clientErr.isFromAPI()) {
        ctx.state.errors = clientErr.buildGenericError();

        return await next();
      }

      /**
       * @type {{message: string, error: Object}}
       */
      const body = e.response.body;
      debug("API error response: %O", body);

      // 404, 403
      switch (e.status) {
        case 404:
        case 403:
          ctx.state.errors = {
            credentials: errMessage.credentials_invalid,
          };
          break;

        // 400: { server: "Problems parsing JSON" }
        // 422: 
        // email: email_missing_field || email_invalid
        // password: password_missing_field || password_invalid
        default:
          ctx.state.errors = clientErr.buildAPIError();
          break;
      }

      debug("Errors: %O", ctx.state.errors);

      return await next();
    }
  }, 
  async (ctx) => {
    ctx.body = await render('login.html', ctx.state);
  }
);

router.get("/wechat", async(ctx, next) => {
  const state = await generateState();

  debug("Authorizetion code state: %s", state);

  ctx.session.state = state;
  const redirectTo = wxOAuth.buildCodeUrl(state);

  debug("Redirect to %s", redirectTo);

  ctx.redirect(redirectTo);
});

/**
 * @description This is just a test.
 * The harded-coded wechat union id is a fake.
 */
router.get("/wechat/test", 
  
  clientApp(),

  async(ctx) => {
    if (isProduction) {
      ctx.status = 404;
      return;
    }
    
    try {
      const account = await new WxUser("tvSxA7L6cgl8nwkrScm_yRzZoVTy")
        .fetchAccount(ctx.state.clientApp);

      ctx.session.user = account;
      ctx.redirect(sitemap.profile);
    } catch (e) {
      if (e.status && e.status == 404) {
        ctx.status = 404;
        return
      }

      throw e;
    }
  }
);

router.get("/callback", 

  clientApp(),

  async(ctx, next) => {
    /**
     * @type {{code: string, state: string, error?: string}}
     */
    const query = ctx.request.query;
    const state = ctx.session.state;

    debug("Query: %O", query);

    if (query.error) {
      ctx.body = query.error;
      return;
    }

    if (!query.state) {
      debug("Query paramter does not contain state");
      ctx.state = 404;
      ctx.body = "state not found"
      return;
    }

    if (query.state != state) {
      debug("state does not match");
      ctx.state = 404;
      ctx.body = "state not match"
      return;
    }

    if (!query.code) {
      debug("Query does not have code");
      ctx.state = 404;
      ctx.body = "code not found"
      return;
    }

    const sessData = await wxOAuth.getSession(code, clientApp)

    const wxSess = new WxUser(sessData.unionId);
    const account = await wxSess.fetchAccount()

    ctx.session.user = account;

    ctx.body = account;
    
    delete ctx.session.state;
  }
);

module.exports = router.routes();
