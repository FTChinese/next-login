const Router = require('koa-router');
const _ = require('lodash');
const request = require('superagent');
const Joi = require('joi');
const schema = require('../schema');

const render = require('../../utils/render');
const debug = require('../../utils/debug')('user:password-reset');
const {handleJoiErr, handleApiUnprocessable} = require('../../utils/errors');
const endpoints = require('../../utils/endpoints');

const handleReset = require('./handle-reset');

const router = new Router();

// Ask user to enter email
// This url is used to render different templates under different conditions.
// Initially the page shows an input box so that user could enter email
// After a password reset letter is sent to the user, the input box is hidden and a success message is shown;
// After password is reset, the input box is hidden and another success message is shown.
router.get('/', async (ctx) => {
  /**
   * @type {{email: boolean, reset: boolean}}
   */
  const ok = ctx.session.ok;

  /**
   * This part is enabled only after email is sent or password is reset.
   */
  if (!_.isEmpty(ok)) {
    ctx.state.ok = ok;
    ctx.body = await render('password/success.html', ctx.state);

    delete ctx.session.ok;
    return;
  }

  /**
   * @type {boolean}
   */
  const invalidLink = ctx.session.invalidLink;
  if (invalidLink) {
    ctx.state.errors = {
      invalidLink
    };
  }
  
  ctx.body = await render('password/enter-email.html', ctx.state);

  delete ctx.session.invalidLink;
});

// Collect user entered email, check if email is valid, and send letter.
router.post('/', async function (ctx, next) {
  /**
   * Validate input data
   * @type {{error: Object, value: Object}}
   */
  const result = schema.email.validate(ctx.request.body);
  if (result.error) {
    const errors = handleJoiErr(result.error)
    ctx.state.errors = errors;

    return await next();
  }

  const email = result.value.email;

  try {    
    // Ask API to sent email.
    await request.post(endpoints.resetLetter)
      .send({email});

    ctx.session.success = {
      emailSent: true
    };

    // Redirect to /password-reset
    return ctx.redirect(ctx.path);

  } catch (e) {
    // Know error could be 400, 404, 422

    // If account for this email is not found
    if (404 === e.status) {
      ctx.state.email = email;
      ctx.state.errors = {
        email: {
          value: email,
          message: '您输入的邮箱不存在'
        }
      };
      return await next();
    }

    if (422 === e.status) {
      ctx.state.errors = handleApiUnprocessable(e)
      return await next();
    }
    
    // Directly output API error response for now.
    return ctx.body = e.response.body;
  }
}, async (ctx) => {
  ctx.body = await render('password/enter-email.html', ctx.state);
});

// Verify password reset token and show reset password page.
// Submit new password.
router.use('/', handleReset);

module.exports = router.routes();