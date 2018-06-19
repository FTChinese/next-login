const debug = require('../../utils/debug')('user:signup');
const Joi = require('joi');
// const sendEmail = require('../../utils/send-email');
const schema = require('../schema');
const {isAlradyExists} = require('../../utils/check-error');

const render = require('../../utils/render');
const request = require('superagent');

exports.showPage = async function (ctx) {
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

  ctx.body = await render('new-user/signup.html', ctx.state);
};

exports.handleCredentials = async function (ctx, next) {
  /**
   * @type {{email: string, password: string}} user
   */
  let user = ctx.request.body.user;

  // Validate user input first.
  try {
    user = await Joi.validate(user, schema.credentials, {
      abortEarly: false
    });
  } catch (e) {
    ctx.state.user = {
      email: user.email
    };

    // handle validation errors
    const joiErrs = schema.gatherErrors(e);

    debug.info('Validation errors: %O', joiErrs);
    ctx.state.errors = joiErrs;

    return await next()
  }

  // Post account info to API.
  try {
    user.signupIP = ctx.ip;
    debug.info('Post to /new-user');

    const resp = await request.post('http://localhost:8000/users/new')
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send(user);

    /**
     * @type {{sub: string, email: string, name: string, isVIP: boolean, verified: boolean}}
     */
    const account = resp.body;

    debug.info('Create new user result: %O', account);

    // Keep login state
    debug.info('Set session');

    ctx.session.user = {
      sub: account.sub,
      name: account.name,
      email: account.email,
      isVIP: account.isVIP,
      verified: account.verified
    };

    return ctx.redirect('/signup/plan');

  } catch (e) {
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
};
