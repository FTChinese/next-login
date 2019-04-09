const Router = require('koa-router');
const debug = require("debug")('user:profile');
const render = require('../../util/render');

const {
  sitemap
} = require("../../lib/sitemap");
const {
  isAPIError,
  buildErrMsg,
  buildApiError
} = require("../../lib/response");
const {
  ProfileValidator
} = require("../../lib/validate");
const {
  FtcUser,
} = require("../../lib/request");

const router = new Router();

router.get("/", async (ctx) => {
  const userId = ctx.session.user.id;

  const user = new FtcUser(userId);

  const profile = await user.fetchProfile();

  ctx.state.profile = profile;
  ctx.body = await render("profile/mobile.html", ctx.state);
});

router.post('/', async (ctx, next) => {

  /**
   * @type {{mobile: string}}
   */
  const profile = ctx.request.body.profile;
  const {
    result,
    errors
  } = new ProfileValidator(profile)
    .mobile()
    .end();


  if (errors) {
    ctx.state.errors = errors;
    ctx.state.profile = profile;

    return await next();
  }

  try {

    await new FtcUser(ctx.session.user.id)
      .updateMobile(result);

    // Tell UI data is saved.
    ctx.session.alert = {
      key: "saved"
    };

    return ctx.redirect(sitemap.profile);

  } catch (e) {
    ctx.state.profile = profile;

    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.state.errors = buildErrMsg(e);

      return await next();
    }

    const body = e.response.body;
    debug("API error response: %O", body);

    ctx.state.errors = buildApiError(body);

    return await next();
  }
}, async (ctx) => {
  ctx.body = await render("profile/mobile.html", ctx.state);
});

module.exports = router.routes();
