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
} = require("../../model/account");

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

  // const resp = await request.get(nextApi.profile)
  //   .set('X-User-Id', userId);

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
  // ctx.state.profile = ctx.session.profile ?
  //   Object.assign(profile, ctx.session.profile) :
  //   profile;

  /**
   * Handle messages passed by redirection.
   * ctx.session might have those fields:
   * alert: {key: "saved"} // indicates new value is save without error.
   * errors: {message?: string, [index: string]: string} // validation error
   * apiErr: {message: string, error?: {field: userName, code: "missing_field | invalid | already_exists"}} // returned by api.
   * `errors` and `apiErr` won't present at the same time.
   */
  if (ctx.session.alert) {
    ctx.state.alert = ctx.session.alert;
  }

  if (ctx.session.errors) {
    ctx.state.errors = ctx.session.errors;
  }

  if (ctx.session.apiErr) {
    ctx.state.errors = buildApiError(ctx.session.apiErr);
  }

  ctx.body = await render('profile/profile.html', ctx.state);

  delete ctx.session.alert;
});

router.use("/display-name", displayName);
router.use("/mobile", mobileNumber);
router.use("/info", personalInfo);
router.use("/address", address);

module.exports = router.routes();
