const debug = require('debug')('user:check-login');

// Those paths must be ignored in whatever cases prevent infinite loop:
// A user is definitely not logged in if he goes to `/login`, and you check it and redirect hime to `/login`; before the page could be shown, he is checked again as not logged in, and redirect to login ... 
const defaultIgnore = ['/login', '/signup', '/signup-check']

/**
 * checkLogin - This middleware will add userinfo to ctx.state
 *
 * @param  {type} ignorePaths=['/login'] Do not check if user logged in for those paths.
 * @return {Async Function}
 */
function checkLogin(ignorePaths=[]) {
  return async (ctx, next) => {
    // Do nothing for `/favicon.ico`
    if (ctx.path == '/favicon.ico') return;

    if (isLoggedIn(ctx)) {
      console.log('user logged in');
      debug('Session data: %O', ctx.session);
  
      ctx.state.userinfo = {
        userName: ctx.session.user.sub
      };
  
      debug('userinfo: %O', ctx.state.userinfo);
      return await next();
    }

    debug('user not logged in');

    /**
     * @type {Object | null} userinfo
     * @property {string} name
     * @property {number} id
     */
    ctx.state.userinfo = null;
    ignorePaths = defaultIgnore.concat(ignorePaths);
    debug("Path to ignore: %o", ignorePaths);

    if (ignorePaths.includes(ctx.path)) {
      return await next();
    }

    // If current page is not `/login`, redirect user to login.
    ctx.redirect('/login');
  }
}

function isLoggedIn(ctx) {
  if (ctx.session.isNew || !ctx.session.user) {
    return false
  }

  return true;
}

module.exports = checkLogin;
