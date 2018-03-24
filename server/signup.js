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
  const user = ctx.request.body.user;

  try {
    /**
     * @type {{email: string, password: string}} validated
     */
    const validated = await Joi.validate(user, schema.credentials, {
      abortEarly: false
    });

    debug('Post to /new-user');

    const resp = await request.post('http://localhost:8000/new-user')
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send(validated);

    const idToken = resp.body;

    debug('Create new user result: %O', idToken);

    // Keep login state
    debug('Set session');

    ctx.session.user = {
      sub: idToken.sub,
      name: idToken.name,
      email: user.email.trim()
    };

    return ctx.redirect('/profile');

  } catch (e) {
    // handle validation errors
    const joiErrs = schema.gatherErrors(e);
    if (joiErrs) {
      debug('Validation errors: %O', joiErrs);
      ctx.state.errors = joiErrs;
    }

    // handle api errors. Since user input has already been validated, API will not produce missing_field errors.
    if (422 == e.status && isAlradyExists(e.response.body.errors)) {
      debug('Email already exists');

      ctx.state.errors = {
        email: '该邮箱已经存在'
      };
    }

    ctx.state.user = {
      email: user.email.trim()
    };

    return ctx.body = await render('signup.html', ctx.state);
  }
});

module.exports = router.routes();
