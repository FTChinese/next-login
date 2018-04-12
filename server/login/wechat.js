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
  // We use hex form to distinguish from wechat base64url form.
  const state = await random.hex(6);

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
router.post('/callback', async (ctx, next) => {
  /**
   * @type {{state: string, access_token: string, expires_in: number, refresh_token: string, openid: string, scope: string, unionid: string}}
   */
  const reqBody = ctx.request.body;

  // If request body does not have previsously sent state, reject.
  if (!reqBody.state) {
    ctx.status = 403
    ctx.body = {
      message: 'Forbidden'
    };
    return;
  }

  // Check if the state is the one sent, and if it is expired.

  // If check passed, save response to database.

  // Use access token to request user info.


  ctx.status = 204;
});

module.exports = router.routes();