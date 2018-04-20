const render = require('../../utils/render');
const debug = require('../../utils/debug')('user:plan');

exports.showPage = async function (ctx) {
  ctx.body = await render('new-user/plan.html', ctx.state);
}

// This step should check login status.
exports.handlePlan = async function (ctx) {
  const reqBody = ctx.request.body;
  debug.info(reqBody);

  ctx.body = reqBody;
  // ctx.redirect('/profile/email');
}