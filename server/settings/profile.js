const debug = require('debug')('user:profile');
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

  try {
    const resp = await request.get('http://localhost:8000/user/profile')
      .auth(`${ctx.accessData.access_token}.${ctx.session.user.sub}`, {type: 'bearer'});

    console.log('User profile: %o', resp.body);

    ctx.state.profile = resp.body;

    ctx.body = await render('settings/profile.html', ctx.state);
  } catch (e) {
    console.log(e)
  }
});

router.post('/', async (ctx, next) => {

  /**
   * @todo Validate input data
   * PATH /user/profile
   */
  ctx.redirect('/settings/profile');
})

module.exports = router.routes();
