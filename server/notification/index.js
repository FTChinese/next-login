const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:account');
const render = require('../../util/render');
const { nextApi } = require("../../lib/endpoints")
const { isAPIError, buildApiError } = require("../../lib/response");

const newsletter = require("./newsletter");

const router = new Router();

// Show newsletter setting page
router.get('/', async (ctx, next) => {

  const userId = ctx.session.user.id;

  const resp = await request.get(endpoints.profile)
    .set('X-User-Id', userId);

  const profile = resp.body;

  // Set email
  ctx.state.account = {
    email: profile.email,
    oldEmail: profile.email
  };
  // Set newsletter
  ctx.state.letter = profile.newsletter;

  // Check redirect message
  if (ctx.session.errors) {
    ctx.state.errors = ctx.session.errors;
  }

  if (ctx.session.alert) {
    ctx.state.alert = ctx.session.alert;
  }
  
  ctx.body = await render('email.html', ctx.state);

  delete ctx.session.errors;
  delete ctx.session.alert;
});

router.use("/newsletter", newsletter);

module.exports = router.routes();