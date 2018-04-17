const request = require('superagent');
const debug = require('../../utils/debug')('user:verify');
const render = require('../../utils/render');

exports.checkToken = async function(ctx) {
  const token = ctx.params.token;

  debug.info('Email verification token: %s', token)
  ctx.state.token = token;

  // Ask API if this token is valid: valid, not exist, already used, expired.

  // If the token is valid, API should flag this token as used, flag the user as active.
  // After receiving aknowlegment from API, the client should show a success message, and lead user to login (if not logged in yet) or refresh login info.
  ctx.body = await render('new-user/verify.html', ctx.state);
};