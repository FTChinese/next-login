const render = require('../utils/render');
const {isSuperAgentError} = require('../utils/errors');

module.exports = function() {
  return async function handleErrors (ctx, next) {
    try {
  // Catch all errors from downstream
      await next();
    } catch (e) {
      // Erros when fallthrough here when GETting to API. If there's a GETting error, it means no page could be shown execept here.
      if (isSuperAgentError(e)) {
        /**
         * @type {APIErrorBody}
         */
        const body = e.response.body;
        
        ctx.state.error = {
          status: e.status,
          message: body.message,
          stack: e.stack
        }
      } else {
        ctx.state.error = {
          status: e.status || 500,
          message: e.message || 'Internal Server Error',
          stack: e.stack
        }
      }

      ctx.status = ctx.state.error.status;
      ctx.body = await render('error.html', ctx.state);
    }
  }
};
