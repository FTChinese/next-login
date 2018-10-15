const Router = require('koa-router');
const request = require('superagent');

const debug = require('../../util/debug')('user:account');
const render = require('../../util/render');
const endpoints = require('../../util/endpoints');

const password = require('./password');
const name = require('./name');
const mobile = require('./mobile');

const router = new Router();

// Show account page
router.get('/', async (ctx, next) => {

  const userId = ctx.session.user.id;

  const resp = await request
    .get(endpoints.profile)
    .set('X-User-Id', userId);

  const profile = resp.body;
  ctx.state.account = profile;

  // Show redirect session data
  if (ctx.session.errors) {
    ctx.state.errors = ctx.session.errors;
  }
  if (ctx.session.alert) {
    ctx.state.alert = ctx.session.alert;
  }
  
  ctx.body = await render('account.html', ctx.state);

  // Remove session data
  delete ctx.session.errors;
  delete ctx.session.alert;
});

router.use('/password', password);
router.use('/name', name);
router.use('/mobile', mobile);

module.exports = router.routes();