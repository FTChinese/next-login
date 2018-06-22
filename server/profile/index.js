const request = require('superagent');
const Router = require('koa-router');

const debug = require('../../utils/debug')('user:profile');
const endpoints = require('../../utils/endpoints');
const {processJoiError, processApiError, isSuperAgentError} = require('../../utils/errors');
const render = require('../../utils/render');

const schema = require('../schema');
const account = require('./account');
const email = require('./email');
const name = require('./name');
const mobile = require('./mobile');
const password = require('./password');
const notification = require('./notification');
const membership = require('./membership');
const address = require('./address');

const router = new Router();

// Show basic profile
router.get('/', async (ctx) => {

  const resp = await request.get(endpoints.profile)
    .set('X-User-Id', ctx.session.user.id);

  console.log('User profile: %o', resp.body);

  /**
   * @type {Profile}
   */
  const profile = resp.body;
  ctx.state.profile = profile;

  ctx.body = await render('profile/home.html', ctx.state);
});

// Update basic profile
router.post('/', async (ctx) => {

  const result = schema.profile.validate(ctx.request.body.profile, {abortEarly: false});

  if (result.error) {
    ctx.session.errors = processJoiError(result.error);
    
    return ctx.redirect(ctx.path);
  }

  /**
   * @type {{familyName: string, givenName: string, gender: string, birthdate: string}}
   */
  const profile = result.value;

  try {
    await request.patch(endpoints.profile)
      .set('X-User-Id', ctx.session.user.id)
      .send(profile);

    ctx.session.alert = {
      saved: true
    };

    return ctx.redirect(ctx.path);
  } catch (e) {
    const errors = processApiError(e);

    ctx.session.errors = errors;

    return ctx.redirect(ctx.path);
  }
});

router.use('/account', account);
router.use('/email', email);
router.use('/name', name);
router.use('/mobile', mobile);
router.use('/password', password);
router.use('/notification', notification);
router.use('/membership', membership);
router.use('/address', address);

module.exports = router.routes();