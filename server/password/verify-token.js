const debug = require('../../utils/debug')('user:enter-email');
const render = require('../../utils/render');

module.exports = async function (ctx, next) {
  // if code is invalid, redirect to `/password-reset`
  // Query database, find out which email this code is linked to.
  const code = ctx.params.code;
  const address = await reset.load(code);

  // If `code` cannot be found, redirect to /passwrod-reset with error message and ask user to enter email.
  if (!address) {
    ctx.session.invalidLink = true;
    const redirectTo = dirname(ctx.path);
    return ctx.redirect(redirectTo);
  }

  // If the email for `code` is found, show user the form the enter new password two times.
  ctx.state.email = address;
  ctx.body = await render('password/new-password.html', ctx.state);
}