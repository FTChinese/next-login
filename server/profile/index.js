const debug = require('debug')('user:settings');
const request = require('superagent');
const Router = require('koa-router');
const Joi = require('joi');
const schema = require('../schema');
const account = require('./account');
const email = require('./email');
const password = require('./password');
const notification = require('./notification');
const membership = require('./membership');
const address = require('./address');

const render = require('../../utils/render');

const router = new Router();

router.use('/account', account);
router.use('/email', email);
router.use('/password', password);
router.use('/notification', notification);
router.use('/membership', membership);
router.use('/address', address);

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
    throw e;
  }
});

router.post('/', async (ctx, next) => {

  /**
   * @type {{familyName: string, givenName: string, gender: string, birthdate: string}}
   */
  let profile = ctx.request.body.profile;

  try {
    profile = await Joi.validate(profile, schema.profile, {
      abortEarly: false,
      convert: false
    });

    const resp = await request.patch('http://localhost:8000/user/profile')
      .set('X-User-Id', ctx.session.user.sub)
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send(profile);

    return ctx.redirect(ctx.path);
  } catch (e) {
    throw e;
  }
});

module.exports = router.routes();