const debug = require('debug')('user:address');
const Router = require('koa-router');
const request = require('superagent');
const Joi = require('joi');
const schema = require('../schema');
const render = require('../../utils/render');
const router = new Router();

router.get('/', async (ctx, next) => {

  const flash = {
    addressSaved: ctx.session.addressSaved
  };

  const resp = await request.get('http://localhost:8000/user/profile')
    .set('X-User-Id', ctx.session.user.sub)
    .auth(ctx.accessData.access_token, {type: 'bearer'});

  console.log('User account: %o', resp.body);

  ctx.state.profile = resp.body;
  ctx.state.flash = flash;

  ctx.body = await render('profile/address.html', ctx.state);
  
  delete ctx.session.addressSaved;
});

router.post('/', async (ctx, next) => {
  let profile = ctx.request.body.profile;
  const address = ctx.request.body.address;

  try {
    profile = await Joi.validate(profile, schema.address);

    const resp = await request.patch('http://localhost:8000/user/profile')
      .set('X-User-Id', ctx.session.user.sub)
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send(profile);

    ctx.session.addressSaved = true;

    return ctx.redirect(ctx.path);

  } catch (e) {
    throw e;
  }
  ctx.body = {
    profile,
    address
  };
});

module.exports = router.routes();