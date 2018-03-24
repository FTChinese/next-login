const debug = require('debug')('user:account');
const {dirname} = require('path');
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
    nameUpdated: ctx.session.nameUpdated ? true : false,
    mobileUpdated: ctx.session.mobileUpdated ? true : false
  }

  const resp = await request.get('http://localhost:8000/user/profile')
    .set('X-User-Id', ctx.session.user.sub)
    .auth(ctx.accessData.access_token, {type: 'bearer'});

  console.log('User account: %o', resp.body);

  ctx.state.user = resp.body;
  ctx.state.flash = flash
  
  ctx.body = await render('profile/account.html', ctx.state);

  delete ctx.session.nameUpdated;
  delete ctx.session.mobileUpdated;
});

router.post('/rename', async (ctx, next) => {
  /**
   * @type {{oldName: string, name: string}}
   */
  let user = ctx.request.body.user;

  try {
    user = await Joi.validate(user, schema.username, {abortEarly: false});

    if (user.oldName === user.name) {
      debug("User did not change name");
      return ctx.redirect(dirname(ctx.path));
    }

    const resp = await request.patch('http://localhost:8000/user/name')
      .set('X-User-Id', ctx.session.user.sub)
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send({name: user.name});

    ctx.session.nameUpdated = true;
    return ctx.redirect(dirname(ctx.path));

  } catch (e) {
    debug(e);
    throw e;
  }
});

router.post('/mobile', async (ctx, next) => {
  /**
   * @type {{oldMobileNumber: string, mobileNumber: string}}
   */
  let user = ctx.request.body.user;

  try {
    user = await Joi.validate(user, schema.mobile, {abortEarly: false});

    if (user.oldMobileNumber === user.mobileNumber) {
      debug("User did not change name");
      return ctx.redirect(dirname(ctx.path));
    }

    const resp = await request.patch('http://localhost:8000/user/mobile')
      .set('X-User-Id', ctx.session.user.sub)
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send({mobileNumber: user.mobileNumber});

    ctx.session.mobileUpdated = true;
    return ctx.redirect(dirname(ctx.path));
    
  } catch (e) {
    debug(e);
    throw e;
  }
});

module.exports = router.routes();