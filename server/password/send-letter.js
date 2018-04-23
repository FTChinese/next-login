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

  // Validate email
  if (!validator.isEmail(email)) {
    // Make previous input sticky
    ctx.state.email = email;
    // Tell `password/enter-email.html` to show error that the email is invalid.
    ctx.state.errors = {
      invalidEmail: true
    };
    // Stops and redisplays the page.
    return await next();
  }

  try {    
    // Ask API to sent email.
    // API will repond 404 Not Found if the email does not exist or 204 No Content if email found.
    const resp = await request.post(`http://localhost:8000/users/password/forgotten`)
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send({email});

    debug.info('API response: email exists');

    ctx.session.success = {
      emailSent: true
    };

    // Redirect to /password-reset using session to notify this url to display different message.
    // Use redirect to prevent user resubmit the data by refresh.
    return ctx.redirect(ctx.path);

  } catch (e) {
    debug.error(e);
    if (!e.response) {
      throw e;
    }

    // If account for this email is not found
    if (404 === e.status) {
      debug.info('Account for email %s not found', email);
      /**
       * ctx.state should contain those data:
       * {
       *  email: "user-entered-email",
       *  errors: {
       *    notFound: true
       *  }
       * }
       */
      // Make user entered data stikcy
      ctx.state.email = email;
      ctx.state.errors = {
        notFound: true
      };
      return await next();
    }
    
    ctx.body = e.response.body;
  }
}