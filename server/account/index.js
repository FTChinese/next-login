const Router = require('koa-router');

const render = require('../../util/render');
const {
  nextApi
} = require("../../model/endpoints")
const {
  buildApiError
} = require("../../lib/response");
const {
  Account,
  FtcUser,
} = require("../../model/request");

const passwordRouter = require('./password');
const emailRouter = require("./email");
const requestVerification = require("./request-verify");

const router = new Router();

/**
 * @description Show account page
 * /user/account
 */
router.get('/', async (ctx, next) => {

  const accountWrapper = new Account(ctx.session.user);
  ;

  const account = await accountWrapper.fetchAccount();
  ctx.state.account = account;
  
  ctx.session.user = account;

  /**
   * @type {{key: "email_changed" | "password_saved"}}
   */
  if (ctx.session.alert) {
    ctx.state.alert = ctx.session.alert;
  }

  ctx.body = await render("account/account.html", ctx.state);

  delete ctx.session.alert;
});

router.use("/email", emailRouter);
router.use('/password', passwordRouter);
router.use("/request-verification", requestVerification);

module.exports = router.routes();
