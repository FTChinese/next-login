const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:profile');
const render = require('../../util/render');
const {
  nextApi
} = require("../../model/endpoints")
const {
  isAPIError,
  buildApiError
} = require("../../lib/response");
const {
  ProfileValidator
} = require("../../lib/validate");
const {
  FtcUser,
} = require("../../model/request");

const displayName = require("./display-name");
const mobileNumber = require("./mobile-number");
const personalInfo = require("./personal");
const address = require("./address");

const router = new Router();

/**
 * @description Show profile page
 * /user/profile
 */
router.get('/', async (ctx) => {

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
});

router.use("/display-name", displayName);
router.use("/mobile", mobileNumber);
router.use("/info", personalInfo);
router.use("/address", address);

module.exports = router.routes();
