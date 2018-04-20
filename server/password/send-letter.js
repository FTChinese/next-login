const request = require('superagent');
const validator = require('validator');

const debug = require('../../utils/debug')('user:send-letter');
const render = require('../../utils/render');

/**
 * @description Collect user entered email and ask API to send letter.
 */
module.exports = async function (ctx, next) {
  /**
   * @type {{email: string}}
   */
  const email = validator.trim(ctx.request.body.email);
  debug.info('Email to receive letter: %O', email);

  // If the email is not valid, redisplay the page.
  if (!validator.isEmail(email)) {
    ctx.state.email = email;
    ctx.state.errors = {
      invalidEmail: true
    };
    return await next();
  }

  try {    
    // Ask API to sent email.
    // If everything goes well, API respond 204.
    const resp = await request.post(`http://localhost:8000/users/password/forgotten`)
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send({email});

    debug.info('API response: email exists');

    if (resp.noContent) {
      ctx.session.success = {
        emailSent: true
      };
      return ctx.redirect(ctx.path);
    }
    
    // No idea how to handle this.
    ctx.body = resp.body;

  } catch (e) {
    debug.error(e);
    if (!e.response) {
      throw e;
    }

    // Make user entered data stikcy
    ctx.state.email = email;

    // If account for this email is not found
    if (404 === e.status) {
      debug.info('Account for email %s not found', email);
      
      ctx.state.errors = {
        notFound: email
      };
      return await next();
    }
    
    ctx.body = e.response.body;
  }
}