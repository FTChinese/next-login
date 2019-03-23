const request = require('superagent');
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
} = require("../../model/account");

const passwordRouter = require('./password');
const emailRouter = require("./email");
const requestVerification = require("./request-verify");

const router = new Router();

/**
 * @description Show account page
 * /user/account
 */
router.get('/', async (ctx, next) => {

  const acntInst = new Account(ctx.session.user);
  ;

  const acntData = await acntInst.fetchAccount();
  ctx.state.account = acntData;
  ctx.state.account.currentEmail = acntData.email;
  
  ctx.session.user = acntData;

  /**
   * @type {{key: "email_changed | password_saved"}}
   */
  if (ctx.session.alert) {
    ctx.state.alert = ctx.session.alert;
  }

  /**
   * @type {{message: string}}
   */
  if (ctx.session.errors) {
    ctx.state.errors = ctx.session.errors;
  }

  /**
   * @type {{ message: string, error: { field: "email", code: "missing_field | invalid | already_exists" } }} for email
   * @type {{ message: string, error: { field: "password", code: "missing_field | invalid" } }} for password
   */
  if (ctx.session.apiErr) {
    /**
     * @type {{ email?: string, password?: string}}
     */
    ctx.state.errors = buildApiError(ctx.session.apiErr);
  }

  ctx.body = await render("account.html", ctx.state);

  // Remove session data
  delete ctx.session.account;
  delete ctx.session.alert;
  delete ctx.session.errors;
  delete ctx.session.apiErr;
});

router.use("/email", emailRouter);
router.use('/password', passwordRouter);
router.use("/request-verification", requestVerification);

module.exports = router.routes();
