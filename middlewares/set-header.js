module.exports = function() {
  return async function(ctx, next) {
    await next();
    ctx.set('Cache-Control', ['no-cache', 'no-store', 'private', 'no-transform']);
    ctx.set('Pragma', 'no-cache');
  }
}