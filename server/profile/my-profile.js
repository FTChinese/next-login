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
      .set('X-User-Id', ctx.session.user.sub)
      .auth(ctx.accessData.access_token, {type: 'bearer'});

    console.log('User profile: %o', resp.body);

    ctx.state.profile = resp.body;

    ctx.body = await render('profile/my-profile.html', ctx.state);
  } catch (e) {
    console.log(e)
  }
});


router.post('/', async (ctx, next) => {

  /**
   * @todo Validate input data
   * PATH /user/profile
   */
  debug('Profile data: %O', ctx.request.body);

  ctx.redirect('/profile');
});

module.exports = router.routes();
