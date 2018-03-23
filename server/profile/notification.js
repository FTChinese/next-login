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
    .set('X-User-Id', ctx.session.user.sub)
    .auth(ctx.accessData.access_token, {type: 'bearer'});

  console.log('User account: %o', resp.body);

  ctx.state.newsletter = resp.body.newsletter;
  
  ctx.body = await render('profile/notification.html', ctx.state);
});

router.post('/', async (ctx, next) => {
  const newsletter = ctx.request.body.newsletter;
  debug(newsletter);

  const letter = {};
  for ([k, v] of Object.entries(newsletter)) {
    letter[k] = v ? true : false
  }

  ctx.body = letter;
});

module.exports = router.routes();