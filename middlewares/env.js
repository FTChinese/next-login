const isProduction = process.env.NODE_ENV === 'production';

module.exports = function() {
  return async (ctx, next) => {
    
    ctx.state.env = {
      isProduction,
      /**
       * @todo Use timezone +08:00 since server time is probably not using China Standard Time. 
       * This problems might merge on the first day of each year: At 00:00 of 1 January, China already entered a new year while this page is still showing last year due to UTC lagging 8 hours behind.
       */
      year: new Date().getFullYear(),
    };

    await next();
  }
}