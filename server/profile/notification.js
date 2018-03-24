const debug = require('debug')('user:account');
const Router = require('koa-router');
const request = require('superagent');
const Joi = require('joi');
const schema = require('../schema');
const render = require('../../utils/render');

const router = new Router();

router.get('/', async (ctx, next) => {
  const accessToken = ctx.accessData.access_token;
  const uuid = ctx.session.user.sub;
  if (!uuid) {
    throw new Error('No UUID found. Access denied');
  }

  debug('Access token: %s; uuid: %s', accessToken, uuid);

  const flash = {
    letterSaved: ctx.session.letterSaved
  };

  const resp = await request.get('http://localhost:8000/user/profile')
    .set('X-User-Id', ctx.session.user.sub)
    .auth(ctx.accessData.access_token, {type: 'bearer'});

  console.log('User account: %o', resp.body);

  ctx.state.letter = resp.body.newsletter;
  ctx.state.flash = flash;

  ctx.body = await render('profile/notification.html', ctx.state);

  delete ctx.session.letterSaved;
});

router.post('/', async (ctx, next) => {
  const letter = {
    todayFocus: false,
    weeklyChoice: false,
    afternoonExpress: false
  };

  try {
    let l = ctx.request.body.letter || {};

    l = await Joi.validate(l, schema.letter);

    Object.assign(letter, l);

    debug(letter);

    const resp = await request.patch('http://localhost:8000/user/newsletter')
      .set('X-User-Id', ctx.session.user.sub)
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send(letter);
    
    ctx.session.letterSaved = true;
    return ctx.redirect(ctx.path);
  } catch (e) {
    throw(e);
  }
});

module.exports = router.routes();