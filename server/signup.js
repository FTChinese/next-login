const debug = require('debug')('user:signup');
const Router = require('koa-router');;
const render = require('../utils/render');
const request = require('superagent');

const router = new Router();

router.get('/', async (ctx, next) => {
  ctx.body = await render('signup.html');
});

router.post('/', async (ctx, next) => {

  /**
   * @type {Object}
   * @property {string} email
   * @property {string} password
   */
  const user = ctx.request.body.user;

  debug("User: %O", user);

  if (!user.email || !user.password) {
    throw new Error('user email or password does not exist');
  }

  const resp = await request.post('http://localhost:8000/new-user')
    .ok(res => res.status < 500)
    .auth(ctx.accessData.access_token, {type: 'bearer'})
    .send(user);

  
  ctx.body = resp.body;
});

module.exports = router.routes();