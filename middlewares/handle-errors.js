const render = require('../utils/render');

module.exports = function() {
  return async function handleErrors (ctx, next) {
    try {
  // Catch all errors from downstream
      await next();
    } catch (e) {
      const error = {
        status: e.status || 500,
        message: e.message || 'Internal Server Error',
        stack: e.stack
      };

      ctx.response.status = error.status;
      ctx.body = await render('error.html', error);
    }
  }
};
