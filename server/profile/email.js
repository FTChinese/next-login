const debug = require('debug')('user:address');
const Router = require('koa-router');
const request = require('superagent');
const render = require('../../utils/render');
const Joi = require('joi');
const schema = require('../schema');
const {isAlradyExists} = require('../../utils/check-error');

const router = new Router();

router.get('/', async (ctx, next) => {
  const emailUpdated = ctx.session.emailUpdated;

  const accessToken = ctx.accessData.access_token;
  const uuid = ctx.session.user.sub;
  if (!uuid) {
    throw new Error('No UUID found. Access denied');
  }

  debug('Access token: %s; uuid: %s', accessToken, uuid);

  try {
    const resp = await request.get('http://localhost:8000/user/profile')
      .auth(`${ctx.accessData.access_token}.${ctx.session.user.sub}`, {type: 'bearer'});

    const email = resp.body.email;
    debug('User email: %o', email);

    ctx.state.email = {
      current: email,
      new: email
    };

    ctx.state.emailUpdated = emailUpdated;

    ctx.body = await render('profile/email.html', ctx.state);

  } catch (e) {
    throw e;
  } finally {
    delete ctx.session.emailUpdated;
  }
});

router.post('/', async (ctx, next) => {
  let email = ctx.request.body.email;

  try {
    email = await Joi.validate(email, schema.changeEmail);

    // If user submit without any modification
    if (email.current === email.new) {
      debug('Use did not change email');
      return ctx.redirect(ctx.path);
    }

    // 204 No Content
    // 422 Unprocessable Entity if email is taken
    // If email changed, we should also send activation letter
    const resp = await request.patch('http://localhost:8000/user/email')
      .auth(`${ctx.accessData.access_token}.${ctx.session.user.sub}`, {type: 'bearer'})
      .send({email: email.new});

    ctx.session.emailUpdated = true;

    return ctx.redirect(ctx.path);
  } catch (e) {
    ctx.state.email = {
      current: email.current,
      new: email.current
    };

    const joiErrs = schema.gatherErrors(e);

    if (joiErrs) {
      debug('Validation errors: %O', joiErrs);
      ctx.state.errors = {
        email: `您输入的邮箱地址"${email.new}"不合法`
      };
      return await next();
    }

    if (422 == e.status && isAlradyExists('email', e.response.body.errors)) {

      ctx.state.errors = {
        email: `无法把您的邮箱更改成"${email.new}"，它已经被别人注册了`
      };

      return await next();
    }

    debug('Response error body: %O', e.response.body);

    throw e;
  }
}, async (ctx, next) => {
  ctx.body = await render('profile/email.html', ctx.state);
});

module.exports = router.routes();