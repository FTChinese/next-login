const Router = require('koa-router');
const {
  URLSearchParams,
} = require("url");
const debug = require('debug')('user:login');

const render = require('../util/render');

const {
  errMessage,
  ClientError,
} = require("../lib/response");
const {
  sitemap
} = require("../lib/sitemap");
const Credentials = require("../lib/credentials");
const {
  WxUser,
  wxOAuth,
} = require("../lib/wxlogin");
const {
  isProduction,
} = require("../lib/config");

const {
  isLoggedIn,
  clientApp,
} = require("./middleware");
const {
  validateLogin,
} = require("./schema");

const router = new Router();

/**
 * @description Show login page
 * /login
 */
router.get('/', async function (ctx) {
  // If user is trying to access this page when he is already logged in, redirect away
  if (ctx.session.user) {
    return ctx.redirect(sitemap.profile);
  }

  ctx.body = await render('login.html', ctx.state);
});

/**
 * @description Handle login data
 * /login
 */
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
    const input = ctx.request.body.credentials;

    const { value, errors } = validateLogin(input);

    if (errors) {
      ctx.state.errors = errors;
      ctx.state.credentials = value;

      return await next();
    }

    // Send data to API
    try {
      /**
       * @type {Account}
       */
      const account = await new Credentials(value)
        .login(ctx.state.clientApp);

      // Keep login state
      ctx.session.user = account;

      // ctx.cookies.set('logged_in', 'yes');

      // Handle FTA OAuth request.
      if (ctx.session.oauth) {
        const params = new URLSearchParams(ctx.session.oauth)
        const redirectTo = `${sitemap.authorize}?${params.toString()}`
        ctx.redirect(redirectTo);

        delete ctx.session.oauth;
        return;
      } else {
        return ctx.redirect(sitemap.profile);
      }

    } catch (e) {
      // stick form
      ctx.state.credentials = input;

      const clientErr = new ClientError(e);

      if (!clientErr.isFromAPI()) {
        throw e;
      }

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

/**
 * @description Handle wechat login request.
 * This will redirect user to wechat.
 * /login/wechat
 */
router.get("/wechat", async(ctx, next) => {
  if (isLoggedIn(ctx)) {
    ctx.status = 404;
    return;
  }
  const state = await wxOAuth.generateState();

  debug("Authorizetion code state: %s", state);

  ctx.session.state = state;
  const redirectTo = wxOAuth.buildCodeUrl({
    state: state.v,
    sandbox: true,
  });

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

/**
 * @description Wecaht OAuth callback for authorization_code.
 * /login/callback
 */
router.get("/callback", 

  clientApp(),

  async(ctx) => {
    /**
     * @type {{code: string, state: string, error?: string}}
     */
    const query = ctx.request.query;
    /**
     * @type {{v: string, t: number}}
     */
    const state = ctx.session.state;

    debug("Query: %O", query);

    /**
     * error: invalid_request | access_denied
     */
    if (query.error) {
      ctx.body = query.error;
      return;
    }

    if (!query.state) {
      debug("Query paramter does not contain state");
      ctx.state = 404;
      ctx.body = "state not found";
      return;
    }

    if (query.state != state.v) {
      debug("state does not match");
      ctx.state = 404;
      ctx.body = "state mismatched"
      return;
    }

    if (wxOAuth.isStateExpired(state)) {
      ctx.state = 404;
      ctx.body = "session expired";
      return;
    }

    if (!query.code) {
      debug("Query does not have code");
      ctx.state = 404;
      ctx.body = "access_denied"
      return;
    }

    const sessData = await wxOAuth.getSession(query.code, ctx.state.clientApp);

    debug("Wx session: %O", sessData);

    const wxSess = new WxUser(sessData.unionId);
    const account = await wxSess.fetchAccount();

    ctx.session.user = account;

    if (ctx.session.oauth) {
      const params = new URLSearchParams(ctx.session.oauth)
      const redirectTo = `${sitemap.authorize}?${params.toString()}`
      ctx.redirect(redirectTo);

      delete ctx.session.oauth;
    } else {
      // If user tries to login to FTAcademy via wechat.
      ctx.redirect(sitemap.profile);
    }
    
    delete ctx.session.state;
  }
);

module.exports = router.routes();
