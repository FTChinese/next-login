const debug = require('../utils/debug')('user:signup');
const Router = require('koa-router');
const Joi = require('joi');
const sendEmail = require('../utils/send-email');
const schema = require('./schema');
const {isAlradyExists} = require('../utils/check-error');

const render = require('../utils/render');
const request = require('superagent');

const router = new Router();

router.get('/', async (ctx, next) => {

  /**
   * @type {{source: string, email: string}} query
   */
  const query = ctx.query;
  const ip = ctx.request.ip;
  debug.info("IP: %s", ip);

  ctx.state.user = {
    email: query.email
  };

  debug.info(ctx.state);

  ctx.body = await render('signup.html', ctx.state);
});

router.post('/', async (ctx, next) => {
  /**
   * @type {{email: string, password: string}} user
   */
  let user = ctx.request.body.user;

  try {
    user = await Joi.validate(user, schema.credentials, {
      abortEarly: false
    });

    user.signupIP = ctx.ip;
    debug.info('Post to /new-user');

    const resp = await request.post('http://localhost:8000/new-user')
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send(user);

    /**
     * @type {{sub: string, email: string, name: string, isVIP: boolean, emailVerified: boolean, activationCode: string}}
     */
    const idToken = resp.body;

    debug.info('Create new user result: %O', idToken);

    /**
     * @todo Send activation email
     */
    const emailResult = await sendEmail({
      name: idToken.name,
      address: user.email,
      subject: '验证注册邮箱',
      text: `点击以下链接验证您在FT中文网注册的邮箱：
      
http://${ctx.host}/password-reset/${idToken.activationCode}

FT中文网`
    });

    debug.info('Send activation email: %o', emailResult);

    // Keep login state
    debug.info('Set session');

    ctx.session.user = {
      sub: idToken.sub,
      name: idToken.name,
      email: user.email
    };

    return ctx.redirect('/profile');

  } catch (e) {
    ctx.state.user = {
      email: user.email
    };

    // handle validation errors
    const joiErrs = schema.gatherErrors(e);
    if (joiErrs) {
      debug.info('Validation errors: %O', joiErrs);
      ctx.state.errors = joiErrs;
      return await next()
    }

    // handle api errors. Since user input has already been validated, API will not produce missing_field errors.
    if (422 == e.status && isAlradyExists(e.response.body.errors)) {
      debug.info('Email already exists');

      ctx.state.errors = {
        email: '该邮箱已经存在'
      };

      return await next();
    }
    
    return ctx.body = e.response.body;
  }
}, async (ctx, next) => {
  return ctx.body = await render('signup.html', ctx.state);
});

module.exports = router.routes();
