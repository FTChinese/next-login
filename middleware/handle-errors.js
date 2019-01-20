const render = require('../util/render');
const debug = require('debug')('user:handle-errors');

module.exports = function() {
  return async function handleErrors (ctx, next) {
    try {
  // Catch all errors from downstream
      await next();
    } catch (e) {

      ctx.state.error = {
        status: e.status || 500,
        message: e.message || 'Internal Server Error',
        stack: e.stack
      }

      ctx.status = ctx.state.error.status;
      ctx.body = await render('error.html', ctx.state);
    }
  }
};
