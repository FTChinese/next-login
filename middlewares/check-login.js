const debug = require('../utils/debug')('user:check-login');

/**
 * checkLogin - This middleware will add userinfo to ctx.state
 *
 * `redirect` is used to prevent infinite loop when used on `/login` path itself.
 * @return {Function}
 */
function checkLogin({redirect=true}={}) {
  return async (ctx, next) => {
    
    // Do nothing for `/favicon.ico`
    if (ctx.path == '/favicon.ico') return;

    debug.info('Redirect: %s', redirect);

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

    // Do this? ctx.session = null;

    ctx.state.user = null;

    if (redirect) {
      const redirectTo = `${env.basePath}/login`;

      debug.info('User not logged in. Redirecting to %s', redirectTo);
  
      ctx.redirect(redirectTo);
    }
  }
}

function isLoggedIn(ctx) {
  if (ctx.session.isNew || !ctx.session.user) {
    return false
  }

  return true;
}

module.exports = checkLogin;
