const request = require('superagent');
const debug = require('../../utils/debug')('user:verify');
const render = require('../../utils/render');

// Requires login.
exports.checkToken = async function(ctx) {
  const token = ctx.params.token;
  const email = ctx.session.user.email;

  debug.info('Email: %s, verification token: %s', email, token);
  
  try {
    const resp = await request.put('http://localhost:8000/users/verify')
      .auth(ctx.accessData.access_token, {type: 'bearer'})
      .send({token, email});
    
    /**
     * @type {{name: string, email: string, isVIP: boolean, verified: boolean}}
     */
    const account = resp.body;
    debug.info("Account info after verification: %O", account);

    ctx.session.user.verified = account.verified;

    ctx.redirect('/profile/email');
  } catch (e) {
    debug.info(e.response.body);

    ctx.session.errors = {
      verify: true
    };
    ctx.redirect('/profile/email');
  }


  // Ask API if this token is valid: valid, not exist, already used, expired.

  // If the token is valid, API should flag this token as used, flag the user as active.
  // After receiving aknowlegment from API, the client should show a success message, and lead user to login (if not logged in yet) or refresh login info.
  ctx.body = await render('new-user/verify.html', ctx.state);
};