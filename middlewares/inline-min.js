const path = require('path');
const {inlineSource} = require('inline-source');
const minify = require('html-minifier').minify;

module.exports = function (assetsPath='./client') {
  return async function (ctx, next) {
    await next();
    // if (process.env.NODE_ENV !== 'production') {
    //   return;
    // }

    if (!ctx.response.is('html')) {
      return;
    }

    let body = ctx.body;
    if (!body || body.pipe) {
      return;
    }

    if (Buffer.isBuffer(body)) body = body.toString();

    body = await inlineSource(body, {
      compress: true,
      rootpath: path.resolve(process.cwd(), assetsPath)
    });

    ctx.body = minify(body, {
      collapseBooleanAttributes: true,
      collapseInlineTagWhitespace: true,
      collapseWhitespace: true,
      conservativeCollapse: true,
      removeComments: true
    });
    return;
  }
};
