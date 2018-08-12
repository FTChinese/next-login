module.exports = function() {
  return async function(ctx, next) {
    await next();
    ctx.set('Cache-Control', ['no-cache', 'no-store', 'must-revalidte']);
    ctx.set('Pragma', 'no-cache');
  }
};
