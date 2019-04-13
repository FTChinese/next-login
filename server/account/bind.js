const Router = require('koa-router');
const debug = require("debug")('user:binding');
const render = require('../../util/render');
const {
  sitemap
} = require("../../lib/sitemap");
const {
  isAPIError,
  buildErrMsg,
  buildApiError,
} = require("../../lib/response");
const {
  AccountValidtor
} = require("../../lib/validate");

const Credentials = require("../../lib/credentials");
const Account = require("../../lib/account");
const FtcUser = require("../../lib/ftc-user");
const {
  WxUser,
} = require("../../lib/wxlogin");
const {
  isProduction,
} = require("../../lib/config");
const {
  clientApp,
} = require("../middleware");

const router = new Router();

router.get("/email", async (ctx, next) => {
  ctx.body = await render("account/email-exists.html", ctx.state);
});

router.post("/email", async(ctx, next) => {
  /**
   * @type {string}
   */
  const email = ctx.request.body.email;

  const credentials = new Credentials({
    email,
  });

  const exists = await credentials.emailExists();

  ctx.session.email = email;

  if (exists) {
    ctx.redirect(sitemap.bindLogin);
    return;
  }

  ctx.redirect(sitemap.bindSignUp);
});

router.get("/login", async(ctx, next) => {
  const email = ctx.session.email;
  if (!email) {
    ctx.status = 404;
    return;
  }

  ctx.state.credentials = {
    email,
  }

  ctx.body = await render("account/login.html", ctx.state);

  if (isProduction) {
    delete ctx.session.email;
  }
});

/**
 * @description If email exists, let user login.
 * After logged in, compare ftc account and wechat account, and then perform mergind accordingly.
 */
router.post("/login",
  clientApp(),

  async(ctx, next) => {
    /**
     * @type {ICredentials}
     */
    const input = ctx.request.body.credentials;

    const credentials = new Credentials(input);

    const ftcId = await credentials.authenticate(ctx.state.clientApp);

    ctx.session.uid = ftcId;

    ctx.redirect(sitemap.bindMerge);
  }
);

/**
 * @description
 * 
 */
router.get("/merge", async(ctx, next) => {

  const userId = ctx.session.uid;

  /**
   * @type {Account}
   */
  const account = ctx.state.user;
  /**
   * @type {Account}
   */
  let wxAccount;
  /**
   * @type {Account}
   */
  let ftcAccount;

  switch (account.loginMethod) {
    case "email":
      const wxAcntData = await new WxUser(userId)
        .fetchAccount();
      wxAccount = new Account(wxAcntData);
      ftcAccount = account;
      break;

    case "wechat":
      wxAccount = account;
      const ftcAcntData = await new FtcUser(userId)
        .fetchAccount();
      ftcAccount = new Account(ftcAcntData);
      break;
  }
  

  let denyMerge = "";

  if (ftcAccount.isEqual(wxAccount)) {
    denyMerge = `两个账号已经绑定，无需操作。如果您未看到绑定后的账号信息，请点击"账号安全"刷新。`
  }

  if (ftcAccount.isCoupled()) {
    denyMerge = `账号 ${ftcAccount.email} 已经绑定了其他微信账号。一个FT中文网账号只能绑定一个微信账号。`
  }

  if (wxAccount.isCoupled()) {
    denyMerge = `微信账号 ${wxAccount.wechat.nickname} 已经绑定了其他FT中文网账号。一个FT中文网账号只能绑定一个微信账号。`
  }

  if (!ftcAccount.member.isExpired() && !wxAccount.member.isExpired()) {
    denyMerge = `您的微信账号和FT中文网的账号均购买了会员服务，两个会员均未到期。合并账号会删除其中一个账号的会员信息。为保障您的权益，暂不支持绑定两个会员未过期的账号。您可以寻求客服帮助。`
  }

  ctx.state.wxAccount = wxAccount;
  ctx.state.ftcAccount = ftcAccount;
  if (denyMerge) {
    ctx.state.denyMerge = denyMerge;
  }

  ctx.body = await render("account/merge.html", ctx.state);

  if (isProduction) {
    delete ctx.session.uid;
  }
});

/**
 * @description Perform accounts merging.
 * ftcId
 * wxId
 */
router.post("/merge", async(ctx, next) => {
  const userId = ctx.request.body.userId;

  if (!userId) {
    ctx.status = 404;
    return;
  }

  /**
   * @type {Account}
   */
  const account = ctx.state.user;

  /**
   * @type {boolean}
   */
  let done;
  switch (account.loginMethod) {
    case "email":
      done = await new WxUser(userId).merge(account.id)
      break;

    case "wechat":
      // If user logged in via wechat, then the target userId must be FTC id.
      done = await new WxUser(account.unionId).merge(userId)
      break;
  }

  if (done) {
    ctx.redirect(sitemap.profile);
    return;
  }

  throw new Error("Unknown error. Please try later.");
});

router.get("/signup", async(ctx, next) => {
  const email = ctx.session.email;
  if (!email) {
    ctx.status = 404;
    return;
  }

  ctx.state.credentials = {
    email,
  }

  ctx.body = await render("account/signup.html", ctx.state);

  if (isProduction) {
    delete ctx.session.email;
  }
});

/**
 * @description If email does not exist, let user sign up.
 * After signed up, the email is automatically bound to current wechat account.
 */
router.post("/signup", 

  clientApp(),

  async(ctx, next) => {

  }
);

module.exports = router.routes();
