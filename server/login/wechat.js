const Router = require('koa-router');
const request = require('superagent');
const router = new Router();
const debug = require('../../utils/debug')('user:wxlogin');
const logger = require('../../utils/logger');
const random = require('../../utils/random');
const UrlBuilder = require('../../utils/url-builder.js');

const baseUrl = 'https://open.weixin.qq.com/connect/qrconnect';
const appId = process.env.WX_WEB_APPID;
const appSecret = process.env.WX_WEB_SECRET;
const redirectUri = 'http://www.ftacademy.cn/wxlogin/callback.php'

if (!appId || !appSecret) {
  debug.info('App id and secret not set');
}

router.get('/', async (ctx, next) => {
  const state = await random.state();

  const redirectTo = new UrlBuilder(baseUrl)
    .query({
      appid: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'snsapi_login',
      state,
    })
    .hash('wechat_redirect')
    .toString();

  debug.info('Redirect to: %s', redirectTo);

  ctx.redirect(redirectTo);
});

// Redirect params example { code: '061UDrZE1T4fx00XOaZE1ZRiZE1UDrZY', state: 'AmKWbR91Zrlg' }
router.get('/callback', async (ctx, next) => {
  /**
   * @type {{code: string, state: string}}
   */
  const query = ctx.query;

  if (!query.code) {
    ctx.body = 'Not authorized';
    return;
  }

  debug.info('Request wechat access token');

  const resp = await request.get('https://api.weixin.qq.com/sns/oauth2/access_token')
    .query({
      appid: appId,
      secret: appSecret,
      code: query.code,
      grant_type: 'authorization_code'
    });

  ctx.body = resp;
});

module.exports = router.routes();