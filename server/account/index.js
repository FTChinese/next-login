const request = require('superagent');
const Router = require('koa-router');

const render = require('../../util/render');
const { nextApi } = require("../../lib/endpoints")

const passwordRouter = require('./password');
const emailRouter = require("./email");
const requestVerification = require("./request-verify");

const router = new Router();

// Show account page
router.get('/', async (ctx, next) => {

  const userId = ctx.session.user.id;

  const resp = await request
    .get(nextApi.account)
    .set('X-User-Id', userId);

    /**
     * @type {{id: string, userName: string, email: string}}
     */
  const account = resp.body;
  account.currentEmail = account.email;
  ctx.state.account = ctx.session.account
    ? Object.assign(account, ctx.session.account)
    : account;

  // Show redirect session data
  if (ctx.session.errors) {
    ctx.state.errors = ctx.session.errors;
  }
  if (ctx.session.alert) {
    ctx.state.alert = ctx.session.alert;
  }
  
  ctx.body = await render("account.html", ctx.state);

  // Remove session data
  delete ctx.session.errors;
  delete ctx.session.alert;
});

router.use("/email", emailRouter);
router.use('/password', passwordRouter);
router.use("/request-verification", requestVerification);

module.exports = router.routes();