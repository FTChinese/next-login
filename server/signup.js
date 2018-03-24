const debug = require('debug')('user:signup');
const Router = require('koa-router');
const Joi = require('joi');
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
  debug("IP: %s", ip);

  ctx.state.user = {
    email: query.email
  };

  debug(ctx.state);

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
    debug('Post to /new-user');

    const resp = await request.post('http://localhost:8000/new-user')
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send(user);

    const idToken = resp.body;

    /**
     * @todo Send activation email
     */

    debug('Create new user result: %O', idToken);

    // Keep login state
    debug('Set session');

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
      debug('Validation errors: %O', joiErrs);
      ctx.state.errors = joiErrs;
      return await next()
    }

    debug('Error: %O', e);

    // handle api errors. Since user input has already been validated, API will not produce missing_field errors.
    if (422 == e.status && isAlradyExists(e.response.body.errors)) {
      debug('Email already exists');

      ctx.state.errors = {
        email: '该邮箱已经存在'
      };

      return await next();
    }
    
    throw e;
  }
}, async (ctx, next) => {
  return ctx.body = await render('signup.html', ctx.state);
});

module.exports = router.routes();
