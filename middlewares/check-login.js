const debug = require('debug')('mw:check-login');


/**
 * checkLogin - This middleware will add userinfo to ctx.state
 *
 * @param  {type} ignorePaths=['/login'] Do not check if user logged in for those paths.
 * @return {Async Function}
 */
function checkLogin(ignorePaths=['/login']) {
  return async (ctx, next) => {
    // Do nothing for `/favicon.ico`
    if (ctx.path == '/favicon.ico') return;

    if (ctx.session.isNew) {
      debug('user not logged in');

      /**
       * @type {Object | null} userinfo
       * @property {string} name
       * @property {number} id
       */
      ctx.state.userinfo = null;

      // If current page is `/login`, just display it.
      if (ignorePaths.includes(ctx.path)) {
        return await next();
      }

      // If current page is not `/login`, redirect user to login.
      ctx.redirect('/login');
      return;
    }

    // If user already logged in, display the requested page.
    console.log('user logged in');
    debug('Session data: %O', ctx.session);

    ctx.state.userinfo = {
      userName: ctx.session.user.sub
    };

    debug('userinfo: %O', ctx.state.userinfo);
    await next();
  }
}

module.exports = checkLogin;
