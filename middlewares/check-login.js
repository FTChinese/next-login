const {escape} = require('querystring')
const debug = require('../utils/debug')('user:check-login');

/**
 * checkLogin - This middleware will add userinfo to ctx.state
 *
 * @param  {type} ignorePaths=['/login'] Do not check if user logged in for those paths.
 * @return {Async Function}
 */
function checkLogin() {
  return async (ctx, next) => {
    debug.info('Accessing URL: %s', ctx.href);

    // Do nothing for `/favicon.ico`
    if (ctx.path == '/favicon.ico') return;

    if (isLoggedIn(ctx)) {
      debug.info('Session data: %O', ctx.session);

      ctx.state.user = {
        name: ctx.session.user.name,
        isVip: ctx.session.user.isVip,
        verified: ctx.session.user.verified
      };

      debug.info('user: %O', ctx.state.user);
      return await next();
    }

    ctx.state.user = null;

    debug.info('User not logged in. Redirecting to /login');
    ctx.redirect(`/login?return_to=${escape(ctx.href)}`);
  }
}

function isLoggedIn(ctx) {
  if (ctx.session.isNew || !ctx.session.user) {
    return false
  }

  return true;
}

module.exports = checkLogin;
