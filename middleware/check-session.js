const debug = require('../util/debug')('user:check-login');
const {sessToAccount} = require('../server/helper.js')

/**
 * checkLogin - This middleware will add userinfo to ctx.state
 *
 * `redirect` is used to pages that want to use user session data but do not need to redirect.
 * In inifinite loop will occur if you use `redirect=true` indiscrimnately on all path.
 * Suppose you want to access `/profile` without login. This middleware will redirect you want to `/login`. And then when you are accessing `/login`, this middleware will again first check if you're loggedin. Certainly your are not. It again redirect you to `/login`, check login state again and redirect you to `/login`, indefinitely.
 * @return {Function}
 */
function checkSession({redirect=true}={}) {
  return async (ctx, next) => {
    
    // Do nothing for `/favicon.ico`
    if (ctx.path == '/favicon.ico') return;

    debug.info('Redirect: %s', redirect);

    if (isLoggedIn(ctx)) {
      debug.info('Session data: %O', ctx.session);

      /**
       * @type {UserSession}
       */
      const user = ctx.session.user;

      ctx.state.userAccount = sessToAccount(user);

      debug.info('ctx.state: %O', ctx.state.userAccount);
      return await next();
    }

    ctx.state.user = null;

    if (redirect) {
      const redirectTo = ctx.state.sitemap.login;

      debug.info('User not logged in. Redirecting to %s', redirectTo);
  
      return ctx.redirect(redirectTo);
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

module.exports = checkSession;
