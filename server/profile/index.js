const Router = require('koa-router');
const debug = require("debug")('user:profile');
const render = require('../../util/render');
const {
  FtcUser,
} = require("../../lib/request");
const Account = require("../../lib/account");

const displayName = require("./display-name");
const mobileNumber = require("./mobile-number");
const personalInfo = require("./personal");
const address = require("./address");

const {
  denyWxOnlyAccess,
} = require("../middleware");

const router = new Router();

/**
 * @description Show profile page
 * /user/profile
 */
router.get('/', 
  async (ctx, next) => {
    /**
     * @type {Account}
     */
    const account = ctx.state.user;

    if (!account.isWxOnly()) {
      return await next();
    }

    ctx.body = await render("profile/profile.html", ctx.state);
    return;
  },

  async (ctx) => {

    const userId = ctx.session.user.id;

    const user = new FtcUser(userId);

    /**
     * @type {Profile}
     */
    const [profile, address] = await Promise.all([
        user.fetchProfile(),
        user.fetchAddress()
    ]);

    ctx.state.profile = profile;
    ctx.state.address = address;

    /**
     * 
     */
    if (ctx.session.alert) {
      ctx.state.alert = ctx.session.alert;
    }

    ctx.body = await render('profile/profile.html', ctx.state);

    delete ctx.session.alert;
  }
);

router.use("/display-name", denyWxOnlyAccess(), displayName);
router.use("/mobile", denyWxOnlyAccess(), mobileNumber);
router.use("/info", denyWxOnlyAccess(), personalInfo);
router.use("/address", denyWxOnlyAccess(), address);

module.exports = router.routes();
