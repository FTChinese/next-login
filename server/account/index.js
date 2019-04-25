const Router = require('koa-router');
const debug = require("debug")("user:account");

const render = require('../../util/render');
const Account = require("../../lib/account");

const passwordRouter = require('./update-password');
const emailRouter = require("./update-email");
const requestVerification = require("./request-verify");
const wxBindEmail = require("./wx-bind-email");

const {
  denyWxOnlyAccess,
} = require("../middleware");

const router = new Router();

/**
 * @description Show account page
 * /user/account
 */
router.get('/', async (ctx, next) => {

  /**
   * @type {Account}
   */
  const account = ctx.state.user;

  debug("Account: %O", account);

  const accountData = await account.fetch();
  ctx.state.account = accountData;
  
  // Update session and ui data.
  ctx.session.user = accountData;
  ctx.state.user = new Account(accountData);

  /**
   * @type {{key: "letter_sent"}}
   */
  if (ctx.session.alert) {
    ctx.state.alert = ctx.session.alert;
  }

  ctx.body = await render("account/account.html", ctx.state);

  delete ctx.session.alert;
});

router.use("/email", denyWxOnlyAccess(), emailRouter);
router.use('/password', denyWxOnlyAccess(), passwordRouter);
router.use("/request-verification", denyWxOnlyAccess(), requestVerification);
router.use("/bind", wxBindEmail);

module.exports = router.routes();
