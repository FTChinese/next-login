const debug = require('debug')('user:account');
const Router = require('koa-router');
const request = require('superagent');
const render = require('../../utils/render');

const router = new Router();

router.get('/', async (ctx, next) => {
  const accessToken = ctx.accessData.access_token;
  const uuid = ctx.session.user.sub;
  if (!uuid) {
    throw new Error('No UUID found. Access denied');
  }

  debug('Access token: %s; uuid: %s', accessToken, uuid);

  const resp = await request.get('http://localhost:8000/user/profile')
    .auth(`${ctx.accessData.access_token}.${ctx.session.user.sub}`, {type: 'bearer'});

  console.log('User account: %o', resp.body);

  ctx.state.account = resp.body;
  
  ctx.body = await render('profile/account.html', ctx.state);
});

router.post('/', async (ctx, next) => {

});

module.exports = router.routes();