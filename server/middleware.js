const debug = require("debug")("user:middleware");
const {
  isProduction,
} = require("../lib/config");
const pkg = require("../package.json");
const {
  matrix,
} = require("../model/footer");
const {
  sidebarNav,
  sitemap,
} = require("../lib/sitemap");
const {
  isAPIError,
} = require("../lib/response");
const Account = require("../lib/account");

const render = require("../util/render");

/**
 * @description Pagination
 * @param {number} perPage - The max number of items per page.
 * Caller should add a property `listSize` to `ctx.state.paging`, 
 * which is the length of dat a fetched, 
 * so that nunjucks know whether to show the Next button.
 */
exports.paging = function paging(perPage = 20) {
  return async (ctx, next) => {
    /**
     * @type {number}
     */
    let page = ctx.request.query.page;
    page = Number.parseInt(page, 10);

    if (!page) {
      page = 1;
    }

    // `page` and `per_page` are used as url query parameters.
    ctx.state.paging = {
      page,
      per_page: perPage,
    };

    await next();
  };
};

exports.env = function () {
  return async (ctx, next) => {

    ctx.state.env = {
      isProduction,
      year: new Date().getFullYear(),
      footer: matrix,
      version: pkg.version,
    };

    await next();
  }
};

exports.nav = function() {
  return async (ctx, next) => {
    const path = ctx.path;

    ctx.state.sideNav = sidebarNav.map(item => {
      return {
        href: item.href,
        text: item.text,
        active: path.startsWith(item.href),
      };
    });

    ctx.state.sitemap = sitemap;

    return await next();
  }
};

/**
 * checkLogin - This middleware will add userinfo to ctx.state
 *
 * `redirect` is used to pages that want to use user session data but do not need to redirect.
 * In inifinite loop will occur if you use `redirect=true` indiscrimnately on all path.
 * Suppose you want to access `/profile` without login. This middleware will redirect you want to `/login`. And then when you are accessing `/login`, this middleware will again first check if you're loggedin. Certainly your are not. It again redirect you to `/login`, check login state again and redirect you to `/login`, indefinitely.
 * @return {Function}
 */
exports.checkSession = function checkSession({
    redirect=true,
    denyWxOnlyAccess=false,
  }={}) {
  return async (ctx, next) => {
    
    // Do nothing for `/favicon.ico`
    if (ctx.path == '/favicon.ico') return;

    debug("Current session: %O", ctx.session);

    debug('Redirect: %s', redirect);

    if (isLoggedIn(ctx)) {
      
      /**
       * @type {IAccount}
       */
      const acntData = ctx.session.user;
      

      ctx.state.user = new Account(acntData);

      return await next();
    }

    ctx.state.user = null;

    if (redirect) {
      return ctx.redirect(sitemap.login);
    }

    // Remember to let the following middleware to excute if users are not loggedin and you do not want to redirect away.
    return await next();
  }
}

function isLoggedIn(ctx) {
  if (ctx.session.isNew || !ctx.session.user) {
    return false
  }

  return true;
}

/**
 * @description If user is logged in via wechat and it's not bound to an FTC account, deny them from accessing endpoints that modify user account since those operations are meaningless.
 */
exports.denyWxOnlyAccess = function() {
  return async (ctx, next) => {
    const account = ctx.state.user;

    if (account.isWxOnly()) {
      ctx.status = 404;
      return;
    }

    return await next();
  };
};

exports.isLoggedIn = isLoggedIn;

exports.handleErrors = function() {
  return async function handleErrors (ctx, next) {
    try {
  // Catch all errors from downstream
      await next();
    } catch (e) {
      
      debug("%O", e);
      
      ctx.state.error = {
        status: e.status || 500,
        stack: e.stack
      }
      
      if (isAPIError(e)) {
        ctx.state.error.message = e.response.body.message
      } else {
        ctx.state.error.message = e.message || 'Internal Server Error'
      }

      ctx.status = ctx.state.error.status;
      ctx.body = await render('error.html', ctx.state);
    }
  }
};

exports.noCache = function() {
  return async function(ctx, next) {
    await next();
    ctx.set('Cache-Control', ['no-cache', 'no-store', 'must-revalidte']);
    ctx.set('Pragma', 'no-cache');
  }
};

exports.clientApp = function() {
  return async function(ctx, next) {
    ctx.state.clientApp = {
      "X-Client-Type": "web",
      "X-Client-Version": pkg.version,
      "X-User-Ip": ctx.ip,
      "X-User-Agent": ctx.header["user-agent"],
    };
    
    await next();
  }
}
