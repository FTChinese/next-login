const Router = require('koa-router');
const MobileDetect = require("mobile-detect");
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
const Account = require("../lib/account");
const {
  WxUser,
  WxOAuth,
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
 * @description Show login page. Wechat login button won't be shown if the browser is on a mobile device since wechat OAuth 2 requires scanning QR code and you cannot scan yourself.
 * GET /login
 */
router.get('/', async function (ctx) {
  // If user is trying to access this page when he is already logged in, redirect away
  if (ctx.session.user) {
    return ctx.redirect(sitemap.profile);
  }

  const md = new MobileDetect(ctx.header["user-agent"]);

  // Only show wechat login button on desktop.
  // You cannot use wecaht OAuth on mobile browser
  // since you can not scan the QRCode on your own
  // device.
  ctx.state.isMobile = !!md.mobile();

  ctx.body = await render('login.html', ctx.state);
});

/**
 * @description Handle login data
 * 
 *  POST /login
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

      // If user is redirect here from /authorize.
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
          ctx.state.errors = clientErr.buildFormError();
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
 * 
 * GET /login/wechat
 * 
 * Session data saved:
 * ```json
 * "state": {
 *  "v": "string",
 *  "t": "unixtimestamp"
 * }
 * ```
 */
router.get("/wechat", async(ctx) => {
  
  const wxOAuth = new WxOAuth();
  const state = await wxOAuth.generateState();
  debug("Authorizetion code state: %s", state);

  // Save state so that we can verify the callback state.
  ctx.session.state = state;
  const redirectTo = wxOAuth.buildCodeUrl(state.v);

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
 * @description Wechat OAuth callback for authorization_code.
 * Here we used subscription api as a transfer point
 * to deliver wechat OAuth code here.
 * If user accessed this page without login, then they
 * must be attempting to log in via wechat OAuth;
 * If user is accessing this page while already logged
 * in and log in method is not `wechat`, it indicates 
 * user is trying to bind to wechat account;
 * If user already logged-in and login method is 
 * `wechat`, deny access.
 * 
 * GET /login/wechat/callback?code=xxx&state=xxx
 */
router.get("/wechat/callback", 

  clientApp(),

  async(ctx) => {
    /**
     * @type {{code: string, state: string, error?: string}}
     */
    const query = ctx.request.query;
    debug("Query: %O", query);

    /**
     * @type {{v: string, t: number}}
     */
    const sessState = ctx.session.state;
    if (!sessState) {
      ctx.status = 404;
      return;
    }

    const error = WxOAuth.validateCallback(query, sessState)
    if (error) {
      ctx.state.error = error;

      ctx.body = await render("wx-oauth.html", ctx.state);

      if (isProduction) {
        delete ctx.session.state;
      }
      
      return;
    }

    const wxOAuth = new WxOAuth();

    const sessData = await wxOAuth.getSession(query.code, ctx.state.clientApp);

    debug("Wx session: %O", sessData);

    const wxSess = new WxUser(sessData.unionId);
    const account = await wxSess.fetchAccount();

    // Delete state data.
    delete ctx.session.state;

    // If user is already logged in, it indicates the
    // OAuth workflow is used for binding accounts.
    if (isLoggedIn(ctx)) {
      debug("User already logged in before porming wechat OAuth");
      /**
       * @type {Account}
       */
      const currentAccount = ctx.state.user;
      if (currentAccount.loginMethod == "wechat") {
        /**
         * @todo Send a human readable 404 page.
         */
        ctx.status = 404;
        return
      }

      // Save the uninon id so that /account/bind/merge knows which account to retrieve.
      ctx.session.uid = account.unionId;

      debug("Redirect user to bind wechat account");

      ctx.redirect(sitemap.bindMerge);
      return 
    }

    // If user is not logged in, this is a login attempt.
    // Persist user account to session.
    ctx.session.user = account;

    // This indicates user is trying to login to ftacademy, so redirect user to OAuth page.
    // Added by /authorize
    if (ctx.session.oauth) {
      debug("User is trying to log in to FTA via FTC's OAuth, which in turn goes to Wechat OAuth.");
      const params = new URLSearchParams(ctx.session.oauth)
      const redirectTo = `${sitemap.authorize}?${params.toString()}`

      ctx.redirect(redirectTo);

      delete ctx.session.oauth;

      return;
    }

    ctx.redirect(sitemap.profile);
  }
);

module.exports = router.routes();
